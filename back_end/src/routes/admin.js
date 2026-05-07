/**
 * @file routes/admin.js
 * @description Rutas del panel de administración con control de acceso por rol.
 *
 * Roles numéricos:  1=super_admin | 2=admin | 3=evaluador | 4=usuario
 *
 * Protección de rutas:
 *   auth         → JWT válido (todos)
 *   panelAuth    → role ≤ 3  (excluye usuarios normales)
 *   requireRole(2) → role ≤ 2  (solo super_admin y admin)
 */

const router               = require('express').Router();
const auth                 = require('../middleware/auth');
const { requireRole, panelAuth } = require('../middleware/adminAuth');
const {
  getStats,
  getUsers,
  toggleUser,
  changeRole,
  getTransactions,
} = require('../controllers/adminController');

// ── Rutas accesibles por roles 1, 2 y 3 ────────────────────────────────────
router.get   ('/users',             auth, panelAuth,       getUsers);
router.patch ('/users/:id/toggle',  auth, panelAuth,       toggleUser);

// ── Rutas accesibles solo por roles 1 y 2 ───────────────────────────────────
router.get   ('/stats',             auth, requireRole(2),  getStats);
router.get   ('/transactions',      auth, requireRole(2),  getTransactions);
router.patch ('/users/:id/role',    auth, requireRole(2),  changeRole);

module.exports = router;
