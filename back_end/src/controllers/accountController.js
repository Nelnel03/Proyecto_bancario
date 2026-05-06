/**
 * @file accountController.js
 * @description Controladores para la gestión de cuentas bancarias.
 *
 * Endpoints que maneja:
 *   POST /api/accounts          → create        (crear cuenta)
 *   GET  /api/accounts          → getMyAccounts (listar mis cuentas)
 *   GET  /api/accounts/:id/balance → getBalance (consultar saldo)
 *
 * Todas las rutas requieren autenticación JWT; `req.user.id` contiene el
 * UUID del usuario autenticado, inyectado por el middleware `auth`.
 */

const { Account, AccountType } = require('../models');
const { ok, fail } = require('../utils/response');

/**
 * Genera un número de cuenta con formato XXXX-XXXX-XXXX (12 dígitos en 3 grupos).
 * Se usa dentro de un bucle en `create` para garantizar unicidad.
 *
 * @returns {string} Número de cuenta, ej: "3821-7645-1093"
 */
const generateAccountNumber = () => {
  const group = () => Math.floor(1000 + Math.random() * 9000);
  return `${group()}-${group()}-${group()}`;
};

/**
 * POST /api/accounts
 * Crea una nueva cuenta bancaria para el usuario autenticado.
 *
 * Reglas de negocio:
 *   - El tipo de cuenta (account_type_id) debe existir en la tabla account_types.
 *   - El número de cuenta se genera aleatoriamente y debe ser único;
 *     el bucle reintenta hasta encontrar uno disponible (colisión extremadamente rara).
 *   - El saldo inicial es siempre 0.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.create = async (req, res) => {
  const { account_type_id } = req.body;

  const accountType = await AccountType.findByPk(account_type_id);
  if (!accountType) {
    return fail(res, 'Tipo de cuenta no encontrado', 404);
  }

  // Generar número de cuenta único (el bucle garantiza que no exista en BD)
  let account_number;
  let exists = true;
  while (exists) {
    account_number = generateAccountNumber();
    exists = await Account.findOne({ where: { account_number } });
  }

  const account = await Account.create({
    account_number,
    user_id: req.user.id,
    account_type_id,
    balance: 0.00,
  });

  return ok(
    res,
    {
      id:             account.id,
      account_number: account.account_number,
      balance:        account.balance,
      type:           accountType.name,
    },
    'Cuenta creada exitosamente',
    201
  );
};

/**
 * GET /api/accounts
 * Lista todas las cuentas activas del usuario autenticado.
 * Incluye el nombre y descripción del tipo de cada cuenta.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getMyAccounts = async (req, res) => {
  const accounts = await Account.findAll({
    where: { user_id: req.user.id, is_active: true },
    include: [{ model: AccountType, as: 'accountType', attributes: ['name', 'description'] }],
    attributes: ['id', 'account_number', 'balance', 'created_at'],
  });

  return ok(res, accounts, 'Cuentas obtenidas exitosamente');
};

/**
 * GET /api/accounts/:id/balance
 * Devuelve el saldo actual de una cuenta específica del usuario autenticado.
 * El filtro `user_id: req.user.id` impide consultar saldos de otros usuarios.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getBalance = async (req, res) => {
  const account = await Account.findOne({
    where: { id: req.params.id, user_id: req.user.id, is_active: true },
    attributes: ['id', 'account_number', 'balance'],
    include: [{ model: AccountType, as: 'accountType', attributes: ['name'] }],
  });

  if (!account) return fail(res, 'Cuenta no encontrada', 404);

  return ok(res, {
    account_number: account.account_number,
    balance:        parseFloat(account.balance),
    type:           account.accountType.name,
  }, 'Saldo obtenido exitosamente');
};
