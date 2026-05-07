/**
 * @file utils/roles.js
 * @description Constantes de roles del sistema. El número es el valor almacenado
 * en la columna `role` de la tabla `users`.
 *
 * Jerarquía (menor número = mayor autoridad):
 *   1 → Super Admin  : único, controla y evalúa a todos los demás roles
 *   2 → Admin        : gestiona evaluadores y usuarios
 *   3 → Evaluador    : administra usuarios y sus cuentas
 *   4 → Usuario      : usuario bancario normal (sin acceso al panel)
 */

const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN:       2,
  EVALUATOR:   3,
  USER:        4,
};

/** Etiqueta legible por rol */
const ROLE_LABELS = {
  1: 'Super Admin',
  2: 'Admin',
  3: 'Evaluador',
  4: 'Usuario',
};

module.exports = { ROLES, ROLE_LABELS };
