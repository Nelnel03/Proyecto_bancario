'use strict';

const { createTestDB } = require('./helpers/setupSequelize');

// ─────────────────────────────────────────────────────────────────────────────
// Tests del modelo Transaction
//
// Transaction registra movimientos de dinero: depósitos, retiros y
// transferencias. Tiene validaciones propias en el campo amount (min:0.01),
// ENUM para type y status, y las FKs source/target son opcionales (nullable)
// dependiendo del tipo de operación.
// ─────────────────────────────────────────────────────────────────────────────

describe('Modelo Transaction', () => {
  let sequelize;
  let Transaction;

  const FAKE_ACCOUNT_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

  beforeAll(async () => {
    ({ sequelize, Transaction } = createTestDB(['Transaction']));
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── TEST 1 ──────────────────────────────────────────────────────────────────
  // Por qué: verificar que build() construye la instancia con los campos de
  //   negocio correctamente (tipo de transacción, monto y cuentas origen/destino).
  // Cómo: se usa build() con un escenario de transferencia válida (type='transfer',
  //   source y target definidos). Se comprueba cada atributo resultante.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() asigna correctamente type, amount, source y target account', () => {
    const tx = Transaction.build({
      type:              'transfer',
      amount:            250.00,
      source_account_id: FAKE_ACCOUNT_ID,
      target_account_id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    });

    expect(tx.type).toBe('transfer');
    expect(parseFloat(tx.amount)).toBe(250);
    expect(tx.source_account_id).toBe(FAKE_ACCOUNT_ID);
    expect(tx.target_account_id).toBe('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb');
  });

  // ── TEST 2 ──────────────────────────────────────────────────────────────────
  // Por qué: el estado inicial de toda transacción debe ser 'pending' (pendiente
  //   de procesamiento). Es un requisito de negocio para el flujo de aprobación.
  // Cómo: build() sin indicar status; se verifica que el defaultValue 'pending'
  //   se aplica automáticamente.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() aplica el valor por defecto status="pending"', () => {
    const tx = Transaction.build({
      type:   'deposit',
      amount: 100.00,
    });

    expect(tx.status).toBe('pending');
  });

  // ── TEST 3 ──────────────────────────────────────────────────────────────────
  // Por qué: type tiene allowNull:false; toda transacción debe declarar
  //   explícitamente si es un depósito, retiro o transferencia. Sin tipo
  //   no se puede ejecutar ninguna lógica de negocio sobre el movimiento.
  // Cómo: build() con type:null y se llama validate(); se verifica que el
  //   error apunta al path 'type'. (La validación de valores ENUM fuera del
  //   conjunto se aplica a nivel de BD en producción con MySQL.)
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando type es null (campo obligatorio)', async () => {
    const tx = Transaction.build({
      type:   null,
      amount: 50.00,
    });

    await expect(tx.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'type' }),
      ]),
    });
  });

  // ── TEST 4 ──────────────────────────────────────────────────────────────────
  // Por qué: el validador min:0.01 impide registrar transacciones con monto
  //   cero o negativo, lo cual no tiene sentido bancariamente.
  // Cómo: se construye una transacción con amount=0 y se llama validate();
  //   se espera que el error mencione el path 'amount'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando amount es 0 (viola el mínimo de 0.01)', async () => {
    const tx = Transaction.build({
      type:   'withdrawal',
      amount: 0,
    });

    await expect(tx.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'amount' }),
      ]),
    });
  });

  // ── TEST 5 ──────────────────────────────────────────────────────────────────
  // Por qué: en un depósito no existe cuenta origen (dinero llega del exterior),
  //   y en un retiro no existe cuenta destino. Las FKs source/target son
  //   allowNull:true precisamente para soportar estos casos de uso.
  // Cómo: se construye un depósito solo con target_account_id (source=null) y
  //   se verifica que validate() no lanza error, confirmando la opcionalidad.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() no falla cuando source_account_id es null (caso: depósito)', async () => {
    const tx = Transaction.build({
      type:              'deposit',
      amount:            500.00,
      source_account_id: null,
      target_account_id: FAKE_ACCOUNT_ID,
    });

    await expect(tx.validate()).resolves.not.toThrow();
    expect(tx.source_account_id).toBeNull();
  });

  // ── TEST 6 ──────────────────────────────────────────────────────────────────
  // Por qué: el modelo define updatedAt:false porque una transacción registrada
  //   es inmutable; no debe modificarse. Este test documenta y protege esa
  //   decisión de diseño.
  // Cómo: se inspeccionan las opciones del modelo y se verifica que updatedAt
  //   está explícitamente desactivado.
  // ────────────────────────────────────────────────────────────────────────────
  it('el modelo tiene updatedAt:false (las transacciones son inmutables)', () => {
    expect(Transaction.options.updatedAt).toBe(false);
  });
});
