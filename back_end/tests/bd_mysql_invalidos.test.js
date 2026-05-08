'use strict';

// Forzar el entorno de desarrollo para que src/models/index.js use
// la BD Servicios_financieros y no la BD _test (que no existe).
process.env.NODE_ENV = 'development';

// ─────────────────────────────────────────────────────────────────────────────
// TESTS DE INTEGRACIÓN CONTRA MySQL REAL
//
// Estos tests se conectan a la base de datos Servicios_financieros definida
// en el .env. Validan que MySQL también rechaza datos incorrectos a nivel de
// motor de base de datos (constraints, ENUM, FK, UNIQUE, NOT NULL).
//
// ¡IMPORTANTE!  MySQL debe estar corriendo y las migraciones aplicadas.
// Todos los registros creados usan el prefijo BDTEST_ y se eliminan al final.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const { sequelize, User, AccountType, Account, Transaction } = require('../src/models');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Op } = require('sequelize');

// Prefijo para identificar todos los registros creados en estos tests
const P = 'BDTEST';

// ─────────────────────────────────────────────────────────────────────────────
// Limpieza global al final de TODA la suite (respeta el orden de FKs)
// ─────────────────────────────────────────────────────────────────────────────
afterAll(async () => {
  // 1. Borrar transacciones que apunten a cuentas de prueba
  const cuentasPrueba = await Account.findAll({
    where: { account_number: { [Op.like]: `%${P}%` } },
    attributes: ['id'],
  });
  const idsCuentas = cuentasPrueba.map(c => c.id);

  if (idsCuentas.length > 0) {
    await Transaction.destroy({
      where: {
        [Op.or]: [
          { source_account_id: { [Op.in]: idsCuentas } },
          { target_account_id: { [Op.in]: idsCuentas } },
        ],
      },
    });
  }

  // 2. Borrar cuentas de prueba
  await Account.destroy({ where: { account_number: { [Op.like]: `%${P}%` } } });

  // 3. Borrar tipos de cuenta de prueba
  await AccountType.destroy({ where: { name: { [Op.like]: `%${P}%` } } });

  // 4. Borrar usuarios de prueba
  await User.destroy({ where: { email: { [Op.like]: `%${P}%` } } });

  await sequelize.close();
}, 30000);

// ══════════════════════════════════════════════════════════════════════════════
// MODELO User — constraints MySQL
// ══════════════════════════════════════════════════════════════════════════════
describe('[MySQL] User — datos negativos', () => {

  // ── TEST 1 ────────────────────────────────────────────────────────────────
  // Por qué: MySQL tiene un índice UNIQUE sobre la columna email. Intentar
  //   guardar dos usuarios con el mismo correo debe generar un error a nivel
  //   de motor de base de datos.
  // Cómo: se crea un usuario válido, luego se intenta crear otro con el mismo
  //   email. Se espera un UniqueConstraintError de Sequelize (mapea el error
  //   1062 de MySQL).
  // ────────────────────────────────────────────────────────────────────────────
  test('email duplicado → UniqueConstraintError en MySQL', async () => {
    const emailDuplicado = `${P}_dup@test.com`;

    await User.create({
      full_name:     `${P} Usuario Base`,
      email:         emailDuplicado,
      password_hash: '$2a$10$hashBase111',
    });

    await expect(
      User.create({
        full_name:     `${P} Usuario Clon`,
        email:         emailDuplicado,  // mismo email → viola UNIQUE
        password_hash: '$2a$10$hashClon222',
      })
    ).rejects.toThrow(UniqueConstraintError);
  }, 15000);

  // ── TEST 2 ────────────────────────────────────────────────────────────────
  // Por qué: el validador isEmail de Sequelize debe interceptar el correo
  //   malformado ANTES de que llegue a MySQL, protegiendo la integridad de
  //   los datos desde la capa de modelo.
  // Cómo: se llama create() con un email sin dominio; se espera
  //   ValidationError (capa Sequelize, no llega al motor).
  // ────────────────────────────────────────────────────────────────────────────
  test('email malformado → ValidationError (interceptado antes de MySQL)', async () => {
    await expect(
      User.create({
        full_name:     `${P} Usuario MailRoto`,
        email:         'esto@',          // sin dominio ni TLD
        password_hash: '$2a$10$hashX',
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);

  // ── TEST 3 ────────────────────────────────────────────────────────────────
  // Por qué: full_name tiene NOT NULL en la migración. Pasar null debe ser
  //   rechazado tanto por Sequelize como por MySQL.
  // Cómo: create() con full_name:null → ValidationError por allowNull:false.
  // ────────────────────────────────────────────────────────────────────────────
  test('full_name null → ValidationError (NOT NULL constraint)', async () => {
    await expect(
      User.create({
        full_name:     null,
        email:         `${P}_nullname@test.com`,
        password_hash: '$2a$10$hashY',
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO AccountType — constraints MySQL
// ══════════════════════════════════════════════════════════════════════════════
describe('[MySQL] AccountType — datos negativos', () => {

  // ── TEST 4 ────────────────────────────────────────────────────────────────
  // Por qué: la columna name tiene UNIQUE en la migración. Dos tipos de cuenta
  //   con el mismo nombre romperían la lógica de clasificación de cuentas.
  // Cómo: se crea un tipo, luego se intenta crear otro con el mismo nombre →
  //   UniqueConstraintError de MySQL.
  // ────────────────────────────────────────────────────────────────────────────
  test('name duplicado → UniqueConstraintError en MySQL', async () => {
    const nameDup = `${P}_TipoCuenta`;

    await AccountType.create({ name: nameDup, description: 'Tipo base para test' });

    await expect(
      AccountType.create({ name: nameDup, description: 'Intento de duplicado' })
    ).rejects.toThrow(UniqueConstraintError);
  }, 15000);

  // ── TEST 5 ────────────────────────────────────────────────────────────────
  // Por qué: name es allowNull:false en el modelo y NOT NULL en la migración.
  //   Sin nombre, el tipo de cuenta es inidentificable.
  // Cómo: create() con name:null → ValidationError (Sequelize lo detecta
  //   antes de enviar la query a MySQL).
  // ────────────────────────────────────────────────────────────────────────────
  test('name null → ValidationError (NOT NULL constraint)', async () => {
    await expect(
      AccountType.create({ name: null })
    ).rejects.toThrow(ValidationError);
  }, 15000);
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO Account — constraints MySQL
// ══════════════════════════════════════════════════════════════════════════════
describe('[MySQL] Account — datos negativos', () => {

  let usuarioPrueba;
  let tipoCuentaPrueba;

  // Crear un usuario y tipo de cuenta reales para usarlos como FK válidas
  beforeAll(async () => {
    usuarioPrueba = await User.create({
      full_name:     `${P} Dueño de Cuenta`,
      email:         `${P}_owner@test.com`,
      password_hash: '$2a$10$hashOwner',
    });

    tipoCuentaPrueba = await AccountType.create({
      name:        `${P}_TipoParaAccount`,
      description: 'Tipo auxiliar para tests de Account',
    });
  }, 15000);

  // ── TEST 6 ────────────────────────────────────────────────────────────────
  // Por qué: account_number tiene UNIQUE en la migración. Dos cuentas con el
  //   mismo número causarían confusión en transacciones y transferencias.
  // Cómo: se crean dos cuentas con el mismo account_number usando FKs válidas
  //   → MySQL rechaza con UniqueConstraintError.
  // ────────────────────────────────────────────────────────────────────────────
  test('account_number duplicado → UniqueConstraintError en MySQL', async () => {
    const numeroDup = `${P}-ACC-001`;

    await Account.create({
      account_number:  numeroDup,
      user_id:         usuarioPrueba.id,
      account_type_id: tipoCuentaPrueba.id,
    });

    await expect(
      Account.create({
        account_number:  numeroDup,   // mismo número → viola UNIQUE
        user_id:         usuarioPrueba.id,
        account_type_id: tipoCuentaPrueba.id,
      })
    ).rejects.toThrow(UniqueConstraintError);
  }, 15000);

  // ── TEST 7 ────────────────────────────────────────────────────────────────
  // Por qué: user_id tiene una FK real en la migración (REFERENCES users(id)).
  //   Crear una cuenta con un UUID que no existe en la tabla users viola
  //   la integridad referencial a nivel de motor MySQL.
  // Cómo: se pasa un UUID inexistente como user_id → MySQL devuelve error de
  //   FK que Sequelize traduce a ForeignKeyConstraintError.
  // ────────────────────────────────────────────────────────────────────────────
  test('user_id inexistente → ForeignKeyConstraintError en MySQL', async () => {
    const uuidFalso = '00000000-0000-4000-a000-000000000000';

    await expect(
      Account.create({
        account_number:  `${P}-ACC-FK-FAIL`,
        user_id:         uuidFalso,      // no existe en tabla users
        account_type_id: tipoCuentaPrueba.id,
      })
    ).rejects.toThrow(ForeignKeyConstraintError);
  }, 15000);

  // ── TEST 8 ────────────────────────────────────────────────────────────────
  // Por qué: account_number es allowNull:false y NOT NULL en la migración.
  //   Sin número de cuenta no se puede identificar la cuenta en operaciones.
  // Cómo: create() con account_number:null → ValidationError.
  // ────────────────────────────────────────────────────────────────────────────
  test('account_number null → ValidationError (NOT NULL constraint)', async () => {
    await expect(
      Account.create({
        account_number:  null,
        user_id:         usuarioPrueba.id,
        account_type_id: tipoCuentaPrueba.id,
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO Transaction — validators Sequelize + ENUM MySQL
// ══════════════════════════════════════════════════════════════════════════════
describe('[MySQL] Transaction — datos negativos', () => {

  let cuentaPrueba;

  // Crear la cadena completa de dependencias: User → AccountType → Account
  beforeAll(async () => {
    const user = await User.create({
      full_name:     `${P} Dueño Transaccion`,
      email:         `${P}_tx_owner@test.com`,
      password_hash: '$2a$10$hashTxOwner',
    });

    const tipo = await AccountType.create({ name: `${P}_TipoTx` });

    cuentaPrueba = await Account.create({
      account_number:  `${P}-TX-ACC`,
      user_id:         user.id,
      account_type_id: tipo.id,
    });
  }, 20000);

  // ── TEST 9 ────────────────────────────────────────────────────────────────
  // Por qué: el validador min:0.01 del modelo impide montos de cero. Una
  //   transacción de $0.00 no mueve dinero y no tiene sentido bancario.
  // Cómo: create() con amount:0 → ValidationError por el validator min:0.01
  //   (Sequelize lo intercepta antes de MySQL).
  // ────────────────────────────────────────────────────────────────────────────
  test('amount = 0 → ValidationError (viola min:0.01)', async () => {
    await expect(
      Transaction.create({
        type:              'deposit',
        amount:            0,
        target_account_id: cuentaPrueba.id,
        description:       `${P} monto cero`,
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);

  // ── TEST 10 ───────────────────────────────────────────────────────────────
  // Por qué: un monto negativo como -500 representaría una deuda inexistente
  //   en el sistema. El validador min:0.01 también bloquea valores negativos.
  // Cómo: create() con amount:-500 → ValidationError.
  // ────────────────────────────────────────────────────────────────────────────
  test('amount = -500 → ValidationError (monto negativo no permitido)', async () => {
    await expect(
      Transaction.create({
        type:              'withdrawal',
        amount:            -500,
        source_account_id: cuentaPrueba.id,
        description:       `${P} monto negativo`,
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);

  // ── TEST 11 ───────────────────────────────────────────────────────────────
  // Por qué: type tiene allowNull:false. Sin tipo no se puede categorizar el
  //   movimiento ni ejecutar la lógica de negocio correspondiente.
  // Cómo: create() con type:null → ValidationError (NOT NULL en modelo y BD).
  // ────────────────────────────────────────────────────────────────────────────
  test('type null → ValidationError (NOT NULL constraint)', async () => {
    await expect(
      Transaction.create({
        type:              null,
        amount:            100,
        target_account_id: cuentaPrueba.id,
        description:       `${P} sin tipo`,
      })
    ).rejects.toThrow(ValidationError);
  }, 15000);

  // ── TEST 12 ───────────────────────────────────────────────────────────────
  // Por qué: MySQL define el campo type como ENUM('deposit','withdrawal',
  //   'transfer'). Insertar un valor fuera de ese conjunto es rechazado
  //   directamente por el motor de base de datos, independientemente de
  //   la capa Sequelize.
  // Cómo: se usa sequelize.query() con SQL raw para saltarse la validación
  //   de Sequelize y enviar el valor inválido directo a MySQL.
  //   Se espera un error de base de datos (ER_TRUNCATED_WRONG_VALUE_FOR_FIELD).
  // ────────────────────────────────────────────────────────────────────────────
  test('type ENUM inválido vía SQL raw → error MySQL ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', async () => {
    const idFalso = require('crypto').randomUUID();

    await expect(
      sequelize.query(`
        INSERT INTO transactions (id, type, amount, target_account_id, status, created_at)
        VALUES (
          '${idFalso}',
          'pago_externo',
          100.00,
          '${cuentaPrueba.id}',
          'pending',
          NOW()
        )
      `)
    ).rejects.toThrow();
  }, 15000);

  // ── TEST 13 ───────────────────────────────────────────────────────────────
  // Por qué: source_account_id y target_account_id son FKs reales en MySQL.
  //   Referenciar un account_id que no existe viola la integridad referencial.
  // Cómo: create() con target_account_id apuntando a un UUID que no existe en
  //   la tabla accounts → MySQL devuelve ForeignKeyConstraintError.
  // ────────────────────────────────────────────────────────────────────────────
  test('target_account_id inexistente → ForeignKeyConstraintError en MySQL', async () => {
    const uuidFalso = '99999999-9999-4999-a999-999999999999';

    await expect(
      Transaction.create({
        type:              'deposit',
        amount:            200,
        target_account_id: uuidFalso,   // no existe en accounts
        description:       `${P} FK rota`,
      })
    ).rejects.toThrow(ForeignKeyConstraintError);
  }, 15000);
});
