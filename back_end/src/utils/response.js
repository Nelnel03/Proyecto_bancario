/**
 * @file response.js
 * @description Helpers para enviar respuestas HTTP consistentes en toda la API.
 *
 * Problema que resuelven:
 *   Sin estos helpers, cada controlador decide libremente el formato de su respuesta,
 *   lo que produce inconsistencias: a veces `{ error }`, a veces `{ message }`,
 *   a veces datos sueltos. El frontend termina manejando múltiples formatos.
 *
 * Formato unificado que producen:
 *   Éxito  → { message: "...", data: { ... } }   (data es opcional)
 *   Error  → { error: "..." }
 */

/**
 * Respuesta de éxito.
 *
 * @param {import('express').Response} res        - Objeto response de Express
 * @param {object|null}                data       - Payload a devolver (puede ser null)
 * @param {string}                     message    - Mensaje descriptivo de la operación
 * @param {number}                    [status=200] - Código HTTP (200, 201, etc.)
 * @returns {import('express').Response}
 *
 * @example
 *   ok(res, { id: user.id }, 'Usuario creado', 201)
 *   // → HTTP 201  { message: "Usuario creado", data: { id: "..." } }
 */
const ok = (res, data, message = 'OK', status = 200) => {
  const body = { message };
  // Solo incluimos "data" si hay algo que devolver; evita { data: null } en respuestas vacías
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
};

/**
 * Respuesta de error.
 *
 * @param {import('express').Response} res          - Objeto response de Express
 * @param {string}                     message      - Descripción del error (visible al cliente)
 * @param {number}                    [status=500]  - Código HTTP (400, 401, 404, 422, etc.)
 * @returns {import('express').Response}
 *
 * @example
 *   fail(res, 'Saldo insuficiente', 422)
 *   // → HTTP 422  { error: "Saldo insuficiente" }
 */
const fail = (res, message, status = 500) =>
  res.status(status).json({ error: message });

module.exports = { ok, fail };
