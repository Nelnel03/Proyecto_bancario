/**
 * @file userController.js
 * @description Controladores para consultar información de usuarios.
 *
 * Endpoints que maneja:
 *   GET /api/users        → getAll   (listar todos los usuarios activos)
 *   GET /api/users/:id    → getById  (obtener un usuario con sus cuentas)
 *
 * Ambas rutas requieren autenticación JWT.
 *
 * Nota de diseño:
 *   Estos endpoints devuelven información de usuarios (no solo del autenticado).
 *   En un sistema bancario real estarían restringidos a un rol administrador.
 *   Para este proyecto académico cualquier usuario autenticado puede consultarlos.
 */

const { User, Account, AccountType } = require('../models');
const { ok, fail } = require('../utils/response');

/**
 * GET /api/users
 * Devuelve la lista de todos los usuarios activos del sistema.
 * No incluye información sensible como password_hash.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getAll = async (req, res) => {
  const users = await User.findAll({
    where:      { is_active: true },
    attributes: ['id', 'full_name', 'email', 'is_active', 'created_at'],
  });

  return ok(res, users, 'Usuarios obtenidos exitosamente');
};

/**
 * GET /api/users/:id
 * Devuelve un usuario específico junto con todas sus cuentas bancarias activas
 * y el tipo de cada cuenta.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.getById = async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: ['id', 'full_name', 'email', 'is_active', 'created_at'],
    include: [{
      model:   Account,
      as:      'accounts',
      // Solo incluimos cuentas activas para no exponer cuentas cerradas
      where:   { is_active: true },
      required: false, // LEFT JOIN: si no tiene cuentas, igual devolvemos el usuario
      include: [{
        model:      AccountType,
        as:         'accountType',
        attributes: ['name', 'description'],
      }],
    }],
  });

  if (!user) return fail(res, 'Usuario no encontrado', 404);

  return ok(res, user, 'Usuario obtenido exitosamente');
};
