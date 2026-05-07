/**
 * @file transactionController.js
 * @description Controladores para operaciones financieras: depósito, retiro, transferencia e historial.
 *
 * Endpoints que maneja:
 *   POST /api/transactions/deposit            → deposit
 *   POST /api/transactions/withdrawal         → withdrawal
 *   POST /api/transactions/transfer           → transfer
 *   GET  /api/transactions/account/:accountId → getHistory
 *
 * Nota sobre atomicidad:
 *   La transferencia usa una transacción de base de datos (dbTx) con LOCK.
 *   Esto garantiza que si dos transferencias ocurren al mismo tiempo sobre la
 *   misma cuenta, no se produzca un "race condition" que lleve el saldo a negativo.
 *   Deposit y withdrawal no necesitan lock porque operan sobre una sola cuenta.
 */

const { Op }                    = require('sequelize');
const { Account, Transaction, sequelize } = require('../models');
const { ok, fail }              = require('../utils/response');

/**
 * POST /api/transactions/deposit
 * Realiza un depósito en cualquier cuenta activa del sistema.
 *
 * ¿Por qué no se verifica la propiedad de la cuenta?
 *   El depósito es equivalente a meter dinero en un cajero a nombre de alguien más.
 *   En un banco real cualquier persona puede depositar en cualquier cuenta siempre
 *   que conozca el número. Por eso este endpoint solo exige que la cuenta exista
 *   y esté activa, sin importar quién sea el dueño.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.deposit = async (req, res) => {
  const { account_number, amount, description } = req.body;

  const account = await Account.findOne({ where: { account_number, is_active: true } });
  if (!account) return fail(res, 'Cuenta destino no encontrada', 404);

  const newBalance = parseFloat(account.balance) + parseFloat(amount);
  await account.update({ balance: newBalance });

  const tx = await Transaction.create({
    type:              'deposit',
    amount,
    target_account_id: account.id,
    description:       description || 'Depósito',
    status:            'completed',
  });

  return ok(
    res,
    { transaction_id: tx.id, new_balance: newBalance },
    'Depósito realizado exitosamente',
    201
  );
};

/**
 * POST /api/transactions/withdrawal
 * Retira fondos de una cuenta propia del usuario autenticado.
 *
 * Reglas de negocio:
 *   - La cuenta debe pertenecer al usuario autenticado (user_id: req.user.id).
 *   - El saldo debe ser suficiente para cubrir el monto solicitado.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.withdrawal = async (req, res) => {
  const { account_number, amount, description } = req.body;

  const account = await Account.findOne({
    where: { account_number, user_id: req.user.id, is_active: true },
  });
  if (!account) return fail(res, 'Cuenta no encontrada', 404);

  if (parseFloat(account.balance) < amount) {
    return fail(res, 'Saldo insuficiente', 422);
  }

  const newBalance = parseFloat(account.balance) - parseFloat(amount);
  await account.update({ balance: newBalance });

  const tx = await Transaction.create({
    type:              'withdrawal',
    amount,
    source_account_id: account.id,
    description:       description || 'Retiro',
    status:            'completed',
  });

  return ok(
    res,
    { transaction_id: tx.id, new_balance: newBalance },
    'Retiro realizado exitosamente',
    201
  );
};

/**
 * POST /api/transactions/transfer
 * Transfiere fondos entre dos cuentas usando una transacción de BD con LOCK.
 *
 * ¿Por qué usar transacción de BD + LOCK aquí?
 *   Sin LOCK, si dos transferencias simultáneas leen el mismo saldo (ej. $1000),
 *   ambas podrían aprobar el descuento y dejar el saldo en negativo.
 *   Con `lock: true` la primera transacción bloquea la fila; la segunda debe
 *   esperar hasta que la primera confirme o revierta, garantizando consistencia.
 *
 * Reglas de negocio:
 *   - La cuenta origen debe pertenecer al usuario autenticado.
 *   - Las cuentas origen y destino deben ser diferentes.
 *   - La cuenta origen debe tener saldo suficiente.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.transfer = async (req, res) => {
  const { source_account_number, target_account_number, amount, description } = req.body;

  if (source_account_number === target_account_number) {
    return fail(res, 'Las cuentas origen y destino deben ser diferentes', 400);
  }

  // Abrimos la transacción de BD antes de cualquier consulta para que los LOCKs
  // funcionen correctamente dentro del mismo contexto de transacción
  const dbTx = await sequelize.transaction();

  try {
    // LOCK en cuenta origen: ninguna otra operación puede modificarla hasta
    // que esta transacción confirme (commit) o revierta (rollback)
    const source = await Account.findOne({
      where:       { account_number: source_account_number, user_id: req.user.id, is_active: true },
      lock:        true,
      transaction: dbTx,
    });
    if (!source) {
      await dbTx.rollback();
      return fail(res, 'Cuenta origen no encontrada', 404);
    }
    if (parseFloat(source.balance) < amount) {
      await dbTx.rollback();
      return fail(res, 'Saldo insuficiente en cuenta origen', 422);
    }

    // LOCK en cuenta destino: evita condiciones de carrera si el destino
    // también está siendo modificado en otra transferencia simultánea
    const target = await Account.findOne({
      where:       { account_number: target_account_number, is_active: true },
      lock:        true,
      transaction: dbTx,
    });
    if (!target) {
      await dbTx.rollback();
      return fail(res, 'Cuenta destino no encontrada', 404);
    }

    // Actualizar saldos dentro de la misma transacción de BD
    await source.decrement('balance', { by: amount, transaction: dbTx });
    await target.increment('balance', { by: amount, transaction: dbTx });

    const tx = await Transaction.create({
      type:              'transfer',
      amount,
      source_account_id: source.id,
      target_account_id: target.id,
      description:       description || 'Transferencia',
      status:            'completed',
    }, { transaction: dbTx });

    await dbTx.commit();

    return ok(
      res,
      {
        transaction_id:     tx.id,
        source_new_balance: parseFloat(source.balance) - parseFloat(amount),
      },
      'Transferencia realizada exitosamente',
      201
    );

  } catch (err) {
    // Si ocurre cualquier error inesperado, revertimos todos los cambios
    await dbTx.rollback();
    throw err; // Express 5 lo captura y lo pasa al manejador global de errores
  }
};

/**
 * GET /api/transactions/account/:accountId
 * Devuelve el historial de transacciones de una cuenta del usuario autenticado.
 * Incluye tanto las transacciones donde la cuenta fue origen como destino.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getHistory = async (req, res) => {
  const account = await Account.findOne({
    where: { id: req.params.accountId, user_id: req.user.id },
  });
  if (!account) return fail(res, 'Cuenta no encontrada', 404);

  const transactions = await Transaction.findAll({
    where: {
      [Op.or]: [
        { source_account_id: account.id },
        { target_account_id: account.id },
      ],
    },
    order: [['created_at', 'DESC']],
  });

  return ok(res, transactions, 'Historial obtenido exitosamente');
};

/**
 * GET /api/transactions/recent?limit=5
 * Devuelve las últimas N transacciones de todas las cuentas del usuario autenticado.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getRecent = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);

  const accounts = await Account.findAll({ where: { user_id: req.user.id }, attributes: ['id'] });
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length === 0) return ok(res, [], 'Sin transacciones');

  const transactions = await Transaction.findAll({
    where: {
      [Op.or]: [
        { source_account_id: { [Op.in]: accountIds } },
        { target_account_id: { [Op.in]: accountIds } },
      ],
    },
    order: [['created_at', 'DESC']],
    limit,
  });

  return ok(res, transactions, 'Transacciones recientes obtenidas');
};
