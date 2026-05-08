'use strict';

const { createTestDB } = require('./helpers/setupSequelize');

// ─────────────────────────────────────────────────────────────────────────────
// Tests del modelo User
//
// Estrategia: se usa una base de datos SQLite en memoria para que los tests sean
// completamente independientes del entorno MySQL de desarrollo/producción.
// - build()     → instancia en memoria (sin escritura en BD).
// - validate()  → ejecuta los validadores del modelo (allowNull, isEmail, etc.)
//                 sin necesidad de persistir en BD.
// - create()    → persiste en BD (requiere sync previo).
// ─────────────────────────────────────────────────────────────────────────────

describe('Modelo User', () => {
  let sequelize;
  let User;

  // Antes de todos los tests se sincronizan los modelos en la BD en memoria.
  beforeAll(async () => {
    ({ sequelize, User } = createTestDB(['User']));
    await sequelize.sync({ force: true });
  });

  // Se cierra la conexión al terminar la suite para liberar recursos.
  afterAll(async () => {
    await sequelize.close();
  });

  // ── TEST 1 ──────────────────────────────────────────────────────────────────
  // Por qué: verificar que el modelo acepta datos válidos y los asigna
  //   correctamente a la instancia.
  // Cómo: se llama a build() con todos los campos requeridos y se comprueban
  //   los atributos resultantes. build() nunca contacta la BD.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() asigna correctamente los campos suministrados', () => {
    const user = User.build({
      full_name:     'Juan Pérez',
      email:         'juan@example.com',
      password_hash: '$2a$10$hashValido',
    });

    expect(user.full_name).toBe('Juan Pérez');
    expect(user.email).toBe('juan@example.com');
    expect(user.password_hash).toBe('$2a$10$hashValido');
  });

  // ── TEST 2 ──────────────────────────────────────────────────────────────────
  // Por qué: comprobar que los valores por defecto definidos en el modelo
  //   (is_active = true, role = 4) se aplican automáticamente al construir
  //   una instancia sin indicar esos campos.
  // Cómo: build() sin is_active ni role; se verifica que Sequelize los rellena
  //   con los defaultValue configurados.
  // ────────────────────────────────────────────────────────────────────────────
  it('build() aplica los valores por defecto: is_active=true y role=4 (usuario normal)', () => {
    const user = User.build({
      full_name:     'Ana García',
      email:         'ana@example.com',
      password_hash: '$2a$10$otraHash',
    });

    expect(user.is_active).toBe(true);
    expect(user.role).toBe(4); // 4 = rol "Usuario" según roles.js
  });

  // ── TEST 3 ──────────────────────────────────────────────────────────────────
  // Por qué: el campo email tiene el validador isEmail:true. Un correo con
  //   formato incorrecto debe ser rechazado antes de tocar la BD.
  // Cómo: se construye un usuario con email inválido y se llama a validate().
  //   Se espera que la promesa se rechace con un ValidationError.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando el email tiene formato incorrecto', async () => {
    const user = User.build({
      full_name:     'Carlos López',
      email:         'esto-no-es-un-email',
      password_hash: '$2a$10$hashCualquiera',
    });

    await expect(user.validate()).rejects.toThrow();
  });

  // ── TEST 4 ──────────────────────────────────────────────────────────────────
  // Por qué: email tiene allowNull:false, lo que significa que es un campo
  //   obligatorio. Debe rechazarse en la capa de validación.
  // Cómo: se pasa email:null y se verifica que validate() rechaza la promesa.
  //   También se comprueba que el mensaje de error menciona el campo 'email'.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando email es null (campo obligatorio)', async () => {
    const user = User.build({
      full_name:     'Pedro Ruiz',
      email:         null,
      password_hash: '$2a$10$hashCualquiera',
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
      ]),
    });
  });

  // ── TEST 5 ──────────────────────────────────────────────────────────────────
  // Por qué: full_name es allowNull:false; sin nombre no debe poder crearse
  //   un usuario válido.
  // Cómo: se construye con full_name:null; se espera que validate() rechace,
  //   indicando el path 'full_name' en el error.
  // ────────────────────────────────────────────────────────────────────────────
  it('validate() lanza error cuando full_name es null (campo obligatorio)', async () => {
    const user = User.build({
      full_name:     null,
      email:         'valido@example.com',
      password_hash: '$2a$10$hashCualquiera',
    });

    await expect(user.validate()).rejects.toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'full_name' }),
      ]),
    });
  });

  // ── TEST 6 ──────────────────────────────────────────────────────────────────
  // Por qué: verificar la lógica de persistencia; el id debe generarse como
  //   UUID v4 de forma automática gracias a defaultValue:DataTypes.UUIDV4.
  // Cómo: se llama a create() (escribe en la BD SQLite en memoria). Se valida
  //   que el id devuelto cumple el patrón de un UUID v4.
  // ────────────────────────────────────────────────────────────────────────────
  it('create() genera automáticamente un id con formato UUID v4', async () => {
    const user = await User.create({
      full_name:     'María Torres',
      email:         'maria@example.com',
      password_hash: '$2a$10$hashSegura',
    });

    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(user.id).toMatch(uuidV4Pattern);
  });
});
