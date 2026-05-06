/**
 * @file validate.js
 * @description Middleware de validación de entradas centralizado.
 *
 * ¿Por qué centralizar la validación aquí y no en los controladores?
 *
 *   Los controladores son responsables de la lógica de negocio (verificar saldo,
 *   crear registros, etc.). Si también validan inputs, mezclan dos responsabilidades
 *   distintas, se vuelven más largos y más difíciles de mantener.
 *
 *   Al sacar la validación a un middleware:
 *     - Los controladores asumen que los datos ya llegaron limpios.
 *     - Las reglas de validación están en un solo lugar: fácil de encontrar y cambiar.
 *     - Podemos reusar la misma regla en múltiples rutas.
 *
 * Uso en rutas:
 *   const { validate, rules } = require('../middlewares/validate');
 *   router.post('/register', validate(rules.register), register);
 *
 * Si la validación falla, el middleware corta el ciclo y responde con HTTP 400.
 * Si todo está bien, llama a next() y el controlador se ejecuta normalmente.
 */

const { fail } = require('../utils/response');

/**
 * @typedef  {object} Rule
 * @property {string}  field      - Nombre del campo en req.body
 * @property {boolean} [required] - Si es obligatorio
 * @property {'string'|'number'|'email'} [type] - Tipo esperado
 * @property {number}  [min]      - Longitud mínima (strings) o valor mínimo (numbers)
 * @property {string}  [message]  - Mensaje de error personalizado
 */

/** Expresión regular básica para validar formato de email. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fábrica de middleware de validación.
 * Recibe un array de reglas y devuelve un middleware Express listo para usar.
 *
 * @param {Rule[]} rules - Array de reglas a aplicar sobre req.body
 * @returns {import('express').RequestHandler}
 */
const validate = (rules) => (req, res, next) => {
  for (const rule of rules) {
    const value = req.body[rule.field];
    const isEmpty = value === undefined || value === null || value === '';

    // ── Campo obligatorio ausente ──────────────────────────────────────────────
    if (rule.required && isEmpty) {
      return fail(res, rule.message || `${rule.field} es obligatorio`, 400);
    }

    // Si el campo no vino y no es obligatorio, saltamos las demás validaciones
    if (isEmpty) continue;

    // ── Validación de tipo numérico ────────────────────────────────────────────
    if (rule.type === 'number' && isNaN(Number(value))) {
      return fail(res, rule.message || `${rule.field} debe ser un número válido`, 400);
    }

    // ── Validación de formato email ────────────────────────────────────────────
    if (rule.type === 'email' && !EMAIL_REGEX.test(value)) {
      return fail(res, rule.message || `${rule.field} debe ser un email válido`, 400);
    }

    // ── Validación de mínimo ───────────────────────────────────────────────────
    if (rule.min !== undefined) {
      const isString = rule.type === 'string' || typeof value === 'string';
      const isNum    = rule.type === 'number';

      if (isString && String(value).length < rule.min) {
        return fail(res, rule.message || `${rule.field} debe tener al menos ${rule.min} caracteres`, 400);
      }
      if (isNum && Number(value) < rule.min) {
        return fail(res, rule.message || `${rule.field} debe ser mayor o igual a ${rule.min}`, 400);
      }
    }
  }

  // Todas las reglas pasaron → continuar al controlador
  next();
};

// ─── Reglas predefinidas por endpoint ──────────────────────────────────────────
//
// Agrupamos las reglas aquí para que las rutas solo necesiten importar `rules`
// y referenciar la clave correspondiente. Así queda claro qué valida cada endpoint
// sin tener que leer el controlador.
//
const rules = {

  // POST /api/auth/register
  register: [
    { field: 'full_name', required: true, type: 'string',
      message: 'full_name es obligatorio' },
    { field: 'email',     required: true, type: 'email',
      message: 'email debe tener un formato válido (ej. usuario@dominio.com)' },
    { field: 'password',  required: true, type: 'string', min: 6,
      message: 'password debe tener al menos 6 caracteres' },
  ],

  // POST /api/auth/login
  login: [
    { field: 'email',    required: true, type: 'email',
      message: 'email debe tener un formato válido' },
    { field: 'password', required: true,
      message: 'password es obligatorio' },
  ],

  // POST /api/accounts
  createAccount: [
    { field: 'account_type_id', required: true,
      message: 'account_type_id es obligatorio' },
  ],

  // POST /api/transactions/deposit
  deposit: [
    { field: 'account_number', required: true,
      message: 'account_number es obligatorio' },
    { field: 'amount', required: true, type: 'number', min: 0.01,
      message: 'amount debe ser un número mayor a 0' },
  ],

  // POST /api/transactions/withdrawal
  withdrawal: [
    { field: 'account_number', required: true,
      message: 'account_number es obligatorio' },
    { field: 'amount', required: true, type: 'number', min: 0.01,
      message: 'amount debe ser un número mayor a 0' },
  ],

  // POST /api/transactions/transfer
  transfer: [
    { field: 'source_account_number', required: true,
      message: 'source_account_number es obligatorio' },
    { field: 'target_account_number', required: true,
      message: 'target_account_number es obligatorio' },
    { field: 'amount', required: true, type: 'number', min: 0.01,
      message: 'amount debe ser un número mayor a 0' },
  ],
};

module.exports = { validate, rules };
