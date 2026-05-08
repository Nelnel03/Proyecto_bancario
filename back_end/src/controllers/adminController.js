/**
 * @file controllers/adminController.js
 * @description Controladores del panel de administración con lógica jerárquica por rol.
 *
 * Roles:  1=super_admin | 2=admin | 3=evaluador | 4=usuario
 *
 * Matriz de permisos:
 * ┌──────────────────────────┬─────────────┬───────┬───────────┐
 * │ Acción                   │ super_admin │ admin │ evaluador │
 * ├──────────────────────────┼─────────────┼───────┼───────────┤
 * │ getStats                 │      ✓      │   ✓   │     ✗     │
 * │ getUsers (ve roles)      │   2, 3, 4   │  3, 4 │     4     │
 * │ toggleUser (is_active)   │    2,3,4    │  3, 4 │     4     │
 * │ changeRole               │      ✓      │  3↔4  │     ✗     │
 * │ getTransactions          │      ✓      │   ✓   │     ✗     │
 * └──────────────────────────┴─────────────┴───────┴───────────┘
 */

const bcrypt                                      = require('bcryptjs');
const { Op }                                      = require('sequelize');
const { User, Account, AccountType, Transaction } = require('../models');
const { ok, fail }                                = require('../utils/response');
const { ROLES, ROLE_LABELS }                      = require('../utils/roles');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Devuelve los roles que el solicitante puede ver/gestionar.
 * super_admin (1) → puede ver 2, 3, 4
 * admin       (2) → puede ver 3, 4
 * evaluador   (3) → puede ver 4
 */
const visibleRoles = (requesterRole) => {
  if (requesterRole === ROLES.SUPER_ADMIN) return [2, 3, 4];
  if (requesterRole === ROLES.ADMIN)       return [3, 4];
  return [4]; // evaluador
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Métricas globales. Solo accesible para roles 1 y 2.
 */
exports.getStats = async (req, res) => {
  const [totalAdmins, totalEvaluators, totalUsers, totalAccounts, totalTransactions, balanceResult] =
    await Promise.all([
      User.count({ where: { role: ROLES.ADMIN } }),
      User.count({ where: { role: ROLES.EVALUATOR } }),
      User.count({ where: { role: ROLES.USER } }),
      Account.count({ where: { is_active: true } }),
      Transaction.count(),
      Account.sum('balance', { where: { is_active: true } }),
    ]);

  return ok(res, {
    total_admins:       totalAdmins,
    total_evaluators:   totalEvaluators,
    total_users:        totalUsers,
    total_accounts:     totalAccounts,
    total_transactions: totalTransactions,
    total_balance:      parseFloat(balanceResult ?? 0),
  }, 'Estadísticas obtenidas');
};

/**
 * GET /api/admin/users
 * Lista usuarios visibles según la jerarquía del solicitante.
 * Incluye cuentas y el rol formateado.
 */
exports.getUsers = async (req, res) => {
  const roles = visibleRoles(req.user.role);

  const users = await User.findAll({
    where:      { role: { [Op.in]: roles } },
    attributes: ['id', 'full_name', 'email', 'is_active', 'role', 'created_at'],
    include: [{
      model:      Account,
      as:         'accounts',
      required:   false,
      include:    [{ model: AccountType, as: 'accountType', attributes: ['name'] }],
      attributes: ['id', 'account_number', 'balance', 'is_active'],
    }],
    order: [['created_at', 'DESC']],
  });

  // Enriquecer con la etiqueta del rol
  const data = users.map((u) => ({
    ...u.toJSON(),
    role_label: ROLE_LABELS[u.role] ?? String(u.role),
  }));

  return ok(res, data, 'Usuarios obtenidos');
};

/**
 * PATCH /api/admin/users/:id/toggle
 * Activa o suspende un usuario (invierte is_active).
 * Verifica que el objetivo esté dentro de los roles visibles.
 */
exports.toggleUser = async (req, res) => {
  if (req.params.id === req.user.id) {
    return fail(res, 'No puedes modificar tu propio estado', 400);
  }

  const roles  = visibleRoles(req.user.role);
  const target = await User.findOne({
    where: { id: req.params.id, role: { [Op.in]: roles } },
  });
  if (!target) return fail(res, 'Usuario no encontrado o fuera de tu alcance', 404);

  await target.update({ is_active: !target.is_active });

  return ok(res, {
    id:        target.id,
    is_active: target.is_active,
  }, target.is_active ? 'Usuario activado' : 'Usuario suspendido');
};

/**
 * PATCH /api/admin/users/:id/role
 * Cambia el rol de un usuario.
 *
 * Restricciones:
 *   - super_admin (1): puede asignar roles 2, 3, 4 a cualquier usuario visible
 *   - admin       (2): puede asignar solo roles 3 ↔ 4 (no puede crear admins ni más)
 *   - evaluador   (3): no tiene acceso a este endpoint (bloqueado en la ruta)
 */
exports.changeRole = async (req, res) => {
  const newRole = parseInt(req.body.role);

  if (!newRole || ![1, 2, 3, 4].includes(newRole)) {
    return fail(res, 'Rol inválido. Valores permitidos: 1, 2, 3, 4', 400);
  }
  if (req.params.id === req.user.id) {
    return fail(res, 'No puedes cambiar tu propio rol', 400);
  }

  const requesterRole = req.user.role;

  // Admin (2) solo puede asignar roles 3 y 4
  if (requesterRole === ROLES.ADMIN && newRole < ROLES.EVALUATOR) {
    return fail(res, 'No tienes permisos para asignar ese rol', 403);
  }

  const roles  = visibleRoles(requesterRole);
  const target = await User.findOne({
    where: { id: req.params.id, role: { [Op.in]: roles } },
  });
  if (!target) return fail(res, 'Usuario no encontrado o fuera de tu alcance', 404);

  // Verificar también que el nuevo rol sea visible para el requester
  if (!roles.includes(newRole) && !(requesterRole === ROLES.SUPER_ADMIN && newRole === ROLES.ADMIN)) {
    return fail(res, 'No tienes permisos para asignar ese rol', 403);
  }

  await target.update({ role: newRole });

  return ok(res, {
    id:         target.id,
    role:       target.role,
    role_label: ROLE_LABELS[target.role],
  }, `Rol actualizado a "${ROLE_LABELS[newRole]}"`);
};

/**
 * POST /api/admin/admins
 * Crea un nuevo usuario con rol Admin (2). Solo accesible por super_admin (1).
 */
exports.createAdmin = async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return fail(res, 'Nombre, email y contraseña son requeridos', 400);
  }
  if (password.length < 6) {
    return fail(res, 'La contraseña debe tener al menos 6 caracteres', 400);
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) return fail(res, 'El email ya está registrado', 409);

  const password_hash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    full_name,
    email,
    password_hash,
    role:      ROLES.ADMIN,
    is_active: true,
  });

  return ok(res, {
    id:         admin.id,
    full_name:  admin.full_name,
    email:      admin.email,
    role:       admin.role,
    role_label: ROLE_LABELS[admin.role],
    is_active:  admin.is_active,
    created_at: admin.created_at,
    accounts:   [],
  }, 'Administrador creado exitosamente', 201);
};

/**
 * GET /api/admin/transactions?page=1&limit=20&type=all
 * Historial global paginado. Solo roles 1 y 2.
 */
exports.getTransactions = async (req, res) => {
  const requesterRole = req.user.role;
  const page   = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
  const type   = req.query.type;
  const offset = (page - 1) * limit;

  const where = type && type !== 'all' ? { type } : {};

  // Evaluador (3): solo ve transacciones de cuentas de usuarios (role 4)
  if (requesterRole === ROLES.EVALUATOR) {
    const userAccounts = await Account.findAll({
      include: [{ model: User, as: 'user', where: { role: ROLES.USER }, attributes: [] }],
      attributes: ['id'],
    });
    const accountIds = userAccounts.map((a) => a.id);
    where[Op.or] = [
      { source_account_id: { [Op.in]: accountIds } },
      { target_account_id: { [Op.in]: accountIds } },
    ];
  }

  const { count, rows } = await Transaction.findAndCountAll({
    where,
    order:   [['created_at', 'DESC']],
    limit,
    offset,
    include: [
      { model: Account, as: 'sourceAccount', attributes: ['account_number'], required: false },
      { model: Account, as: 'targetAccount', attributes: ['account_number'], required: false },
    ],
  });

  return ok(res, {
    total:        count,
    page,
    pages:        Math.ceil(count / limit),
    transactions: rows,
  }, 'Transacciones obtenidas');
};
