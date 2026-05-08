'use strict';

const { createTestDB } = require('./helpers/setupSequelize');

// ─────────────────────────────────────────────────────────────────────────────
// Tests del modelo AccountType
//
// AccountType representa los tipos de cuenta bancaria (ej: "Cuenta Corriente",
// "Cuenta de Ahorros"). Tiene PK INTEGER autoIncrement, sin timestamps, y el
// campo description es opcional (allowNull:true).
// ─────────────────────────────────────────────────────────────────────────────

describe('Modelo AccountType', () => {
  let sequelize;
  let AccountType;

  beforeAll(async () => {
    ({ sequelize, AccountType } = createTestDB(['AccountType']));
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── TEST 1 ──────────────────────────────────────────────────────────────────
  // Por qué: verificar que build() construye correctamente la instancia con los
  //   campos básicos del tipo de cuenta.
  // Cómo: se llama build() con name y description; se comprueba que ambos
  //   atributos están disponibles en la instancia sin persistir en BD.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() asigna correctamente name y description', () => {
    const accountType = AccountType.build({
      name:        'Cuenta Corriente',
      description: 'Cuenta de uso diario con tarjeta de débito.',
    });

    expect(accountType.name).toBe('Cuenta Corriente');
    expect(accountType.description).toBe('Cuenta de uso diario con tarjeta de débito.');
  });

  // ── TEST 2 ──────────────────────────────────────────────────────────────────
  // Por qué: description es allowNull:true, lo que significa que es un campo
  //   completamente opcional. Un tipo de cuenta sin descripción es válido.
  // Cómo: se construye una instancia con description:null (valor explícito) y
  //   se llama validate(); se espera que la promesa se resuelva sin errores y
  //   que el atributo permanezca null.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() no falla cuando description es null (campo opcional)', async () => {
    const accountType = AccountType.build({ name: 'Cuenta de Ahorros', description: null });

    await expect(accountType.validate()).resolves.not.toThrow();
    expect(accountType.description).toBeNull();
  });

  // ── TEST 3 ──────────────────────────────────────────────────────────────────
  // Por qué: name es allowNull:false, es el identificador semántico del tipo de
  //   cuenta. Sin nombre el registro sería inútil e inconsistente.
  // Cómo: se construye con name:null y se llama validate(); se verifica que el
  //   error incluye el path 'name'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando name es null (campo obligatorio)', async () => {
    const accountType = AccountType.build({ name: null });

    await expect(accountType.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
      ]),
    });
  });

  // ── TEST 4 ──────────────────────────────────────────────────────────────────
  // Por qué: el modelo define timestamps:false, lo que significa que Sequelize
  //   NO debe crear ni gestionar los campos createdAt/updatedAt. Es importante
  //   validarlo para evitar errores en la migración y en las queries.
  // Cómo: se inspecciona las opciones del modelo para confirmar que timestamps
  //   está desactivado.
  // ────────────────────────────────────────────────────────────────────────────
  it('el modelo tiene timestamps:false (sin createdAt ni updatedAt)', () => {
    expect(AccountType.options.timestamps).toBe(false);
  });

  // ── TEST 5 ──────────────────────────────────────────────────────────────────
  // Por qué: el id es un INTEGER autoIncrement; la BD debe asignarlo
  //   automáticamente. Esto garantiza que no se necesita generarlo manualmente
  //   y que los registros son secuenciales.
  // Cómo: se crean dos tipos de cuenta distintos y se verifica que el segundo
  //   tiene un id mayor que el primero (comportamiento esperado de autoIncrement).
  // ────────────────────────────────────────────────────────────────────────────
  it('create() genera ids autoIncrement secuenciales', async () => {
    const tipo1 = await AccountType.create({ name: 'Tipo A' });
    const tipo2 = await AccountType.create({ name: 'Tipo B' });

    expect(typeof tipo1.id).toBe('number');
    expect(typeof tipo2.id).toBe('number');
    expect(tipo2.id).toBeGreaterThan(tipo1.id);
  });
});
