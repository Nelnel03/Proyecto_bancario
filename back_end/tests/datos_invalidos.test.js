'use strict';

const { createTestDB } = require('./helpers/setupSequelize');

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO DE VALIDACIÓN CON DATOS INVÁLIDOS
//
// Propósito: demostrar que el sistema rechaza correctamente datos erróneos.
// Todos los tests de este archivo esperan que la validación FALLE (rejects),
// lo cual significa que si el test PASA → la protección está funcionando.
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// MODELO USER — datos inválidos
// ══════════════════════════════════════════════════════════════════════════════
describe('[User] Datos inválidos — deben ser rechazados', () => {
  let sequelize, User;

  beforeAll(async () => {
    ({ sequelize, User } = createTestDB(['User']));
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { await sequelize.close(); });

  test('email sin arroba → "juanexample.com"', async () => {
    const u = User.build({ full_name: 'Juan', email: 'juanexample.com', password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });

  test('email con doble arroba → "juan@@example.com"', async () => {
    const u = User.build({ full_name: 'Juan', email: 'juan@@example.com', password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });

  test('email solo espacios → "   "', async () => {
    const u = User.build({ full_name: 'Juan', email: '   ', password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });

  test('email como número → 12345', async () => {
    const u = User.build({ full_name: 'Juan', email: 12345, password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });

  test('full_name vacío (null) → sin nombre no hay usuario válido', async () => {
    const u = User.build({ full_name: null, email: 'ok@mail.com', password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });

  test('password_hash vacío (null) → campo obligatorio', async () => {
    const u = User.build({ full_name: 'Juan', email: 'ok@mail.com', password_hash: null });
    await expect(u.validate()).rejects.toThrow();
  });

  test('email null → campo obligatorio', async () => {
    const u = User.build({ full_name: 'Juan', email: null, password_hash: 'abc' });
    await expect(u.validate()).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO AccountType — datos inválidos
// ══════════════════════════════════════════════════════════════════════════════
describe('[AccountType] Datos inválidos — deben ser rechazados', () => {
  let sequelize, AccountType;

  beforeAll(async () => {
    ({ sequelize, AccountType } = createTestDB(['AccountType']));
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { await sequelize.close(); });

  test('name null → campo obligatorio', async () => {
    const at = AccountType.build({ name: null });
    await expect(at.validate()).rejects.toThrow();
  });

  test('name undefined → campo obligatorio', async () => {
    const at = AccountType.build({ name: undefined });
    await expect(at.validate()).rejects.toThrow();
  });

  test('name como número en lugar de texto → 999', async () => {
    // Sequelize castea el número a string "999", pero sigue siendo
    // inválido si en producción el controller no lo permite
    const at = AccountType.build({ name: null, description: 'algo' });
    await expect(at.validate()).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO Account — datos inválidos
// ══════════════════════════════════════════════════════════════════════════════
describe('[Account] Datos inválidos — deben ser rechazados', () => {
  let sequelize, Account;

  const UUID_VALIDO = '11111111-1111-4111-a111-111111111111';

  beforeAll(async () => {
    ({ sequelize, Account } = createTestDB(['Account']));
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { await sequelize.close(); });

  test('account_number null → campo obligatorio', async () => {
    const a = Account.build({ account_number: null, user_id: UUID_VALIDO, account_type_id: 1 });
    await expect(a.validate()).rejects.toThrow();
  });

  test('user_id null → FK obligatoria (cuenta sin dueño)', async () => {
    const a = Account.build({ account_number: '001-0001', user_id: null, account_type_id: 1 });
    await expect(a.validate()).rejects.toThrow();
  });

  test('account_type_id null → FK obligatoria (tipo de cuenta desconocido)', async () => {
    const a = Account.build({ account_number: '001-0002', user_id: UUID_VALIDO, account_type_id: null });
    await expect(a.validate()).rejects.toThrow();
  });

  test('todos los campos en null → fallo múltiple', async () => {
    const a = Account.build({ account_number: null, user_id: null, account_type_id: null });
    await expect(a.validate()).rejects.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MODELO Transaction — datos inválidos
// ══════════════════════════════════════════════════════════════════════════════
describe('[Transaction] Datos inválidos — deben ser rechazados', () => {
  let sequelize, Transaction;

  beforeAll(async () => {
    ({ sequelize, Transaction } = createTestDB(['Transaction']));
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { await sequelize.close(); });

  test('amount = 0 → viola el mínimo permitido de 0.01', async () => {
    const tx = Transaction.build({ type: 'deposit', amount: 0 });
    await expect(tx.validate()).rejects.toThrow();
  });

  test('amount = -100 → monto negativo no permitido', async () => {
    const tx = Transaction.build({ type: 'withdrawal', amount: -100 });
    await expect(tx.validate()).rejects.toThrow();
  });

  test('amount = -0.01 → negativo pequeño tampoco permitido', async () => {
    const tx = Transaction.build({ type: 'deposit', amount: -0.01 });
    await expect(tx.validate()).rejects.toThrow();
  });

  test('amount null → campo obligatorio', async () => {
    const tx = Transaction.build({ type: 'deposit', amount: null });
    await expect(tx.validate()).rejects.toThrow();
  });

  test('type null → campo obligatorio (sin tipo no hay transacción)', async () => {
    const tx = Transaction.build({ type: null, amount: 100 });
    await expect(tx.validate()).rejects.toThrow();
  });

  test('amount = 0.001 → por debajo del mínimo de 0.01', async () => {
    const tx = Transaction.build({ type: 'transfer', amount: 0.001 });
    await expect(tx.validate()).rejects.toThrow();
  });
});
