'use strict';

const { createTestDB } = require('./helpers/setupSequelize');

// ─────────────────────────────────────────────────────────────────────────────
// Tests del modelo Account
//
// Account representa una cuenta bancaria vinculada a un usuario y a un tipo
// de cuenta. Tiene UUID como PK, balance con precisión decimal, y varios
// campos obligatorios (account_number, user_id, account_type_id).
// ─────────────────────────────────────────────────────────────────────────────

describe('Modelo Account', () => {
  let sequelize;
  let Account;

  // UUIDs de referencia fijos para user_id y account_type_id.
  // En tests de unidad de modelo no se crean los registros padres;
  // solo se valida la lógica del modelo Account en sí mismo.
  const FAKE_USER_ID         = '11111111-1111-4111-a111-111111111111';
  const FAKE_ACCOUNT_TYPE_ID = 1;

  beforeAll(async () => {
    ({ sequelize, Account } = createTestDB(['Account']));
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── TEST 1 ──────────────────────────────────────────────────────────────────
  // Por qué: verificar que todos los campos requeridos se asignan correctamente
  //   en una instancia construida con datos válidos.
  // Cómo: build() con los 4 campos obligatorios; se comprueban los atributos
  //   resultantes. No se hace ninguna operación en BD.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() asigna correctamente account_number, user_id y account_type_id', () => {
    const account = Account.build({
      account_number:  '001-0000001',
      user_id:         FAKE_USER_ID,
      account_type_id: FAKE_ACCOUNT_TYPE_ID,
    });

    expect(account.account_number).toBe('001-0000001');
    expect(account.user_id).toBe(FAKE_USER_ID);
    expect(account.account_type_id).toBe(FAKE_ACCOUNT_TYPE_ID);
  });

  // ── TEST 2 ──────────────────────────────────────────────────────────────────
  // Por qué: balance debe comenzar en 0.00 cuando no se especifica, y
  //   is_active debe ser true para que la cuenta esté operativa al crearla.
  //   Ambos son valores de negocio críticos.
  // Cómo: build() sin balance ni is_active; se verifica que los defaultValue
  //   configurados en el modelo se aplican automáticamente.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() aplica los valores por defecto: balance=0.00 e is_active=true', () => {
    const account = Account.build({
      account_number:  '001-0000002',
      user_id:         FAKE_USER_ID,
      account_type_id: FAKE_ACCOUNT_TYPE_ID,
    });

    expect(parseFloat(account.balance)).toBe(0);
    expect(account.is_active).toBe(true);
  });

  // ── TEST 3 ──────────────────────────────────────────────────────────────────
  // Por qué: account_number es el identificador humano de la cuenta y tiene
  //   allowNull:false. Sin él no es posible identificar la cuenta en
  //   operaciones bancarias.
  // Cómo: build() con account_number:null; validate() debe rechazar con un
  //   error que apunta al path 'account_number'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando account_number es null (campo obligatorio)', async () => {
    const account = Account.build({
      account_number:  null,
      user_id:         FAKE_USER_ID,
      account_type_id: FAKE_ACCOUNT_TYPE_ID,
    });

    await expect(account.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'account_number' }),
      ]),
    });
  });

  // ── TEST 4 ──────────────────────────────────────────────────────────────────
  // Por qué: user_id es la FK al usuario propietario y tiene allowNull:false.
  //   Una cuenta sin dueño rompe la integridad referencial del sistema.
  // Cómo: build() con user_id:null; se comprueba que validate() rechaza con
  //   error en el path 'user_id'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando user_id es null (FK obligatoria)', async () => {
    const account = Account.build({
      account_number:  '001-0000003',
      user_id:         null,
      account_type_id: FAKE_ACCOUNT_TYPE_ID,
    });

    await expect(account.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'user_id' }),
      ]),
    });
  });

  // ── TEST 5 ──────────────────────────────────────────────────────────────────
  // Por qué: account_type_id es la FK al tipo de cuenta y tiene allowNull:false.
  //   Sin conocer el tipo de cuenta no se pueden aplicar las reglas de negocio
  //   correctas (límites de saldo, comisiones, etc.).
  // Cómo: build() con account_type_id:null; validate() debe indicar el error
  //   en el path 'account_type_id'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando account_type_id es null (FK obligatoria)', async () => {
    const account = Account.build({
      account_number:  '001-0000004',
      user_id:         FAKE_USER_ID,
      account_type_id: null,
    });

    await expect(account.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'account_type_id' }),
      ]),
    });
  });

  // ── TEST 6 ──────────────────────────────────────────────────────────────────
  // Por qué: validar que la creación en BD genera un id con formato UUID v4,
  //   igual que el modelo User. Asegura coherencia en las PKs del sistema.
  // Cómo: create() con datos válidos; se valida el id con regex de UUID v4.
  // ────────────────────────────────────────────────────────────────────────────
  it('create() genera automáticamente un id con formato UUID v4', async () => {
    const account = await Account.create({
      account_number:  '001-9999999',
      user_id:         FAKE_USER_ID,
      account_type_id: FAKE_ACCOUNT_TYPE_ID,
    });

    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(account.id).toMatch(uuidV4Pattern);
  });
});
