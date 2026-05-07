/**
 * @file middleware/adminAuth.js
 * @description Middlewares de autorización por rol numérico.
 *
 * Jerarquía de roles (menor número = mayor autoridad):
 *   1 = Super Admin  → acceso total
 *   2 = Admin        → accede a la mayoría del panel
 *   3 = Evaluador    → acceso limitado (solo gestión de usuarios)
 *   4 = Usuario      → sin acceso al panel de administración
 *
 * Se encadena DESPUÉS del middleware `auth` (que verifica el JWT y
 * popula req.user con { id, email, role }).
 */

/**
 * Permite el acceso a cualquier rol con número ≤ maxRole.
 * Uso:  router.get('/ruta', auth, requireRole(2), controlador)
 * → solo super_admin (1) y admin (2) pueden acceder.
 *
 * @param {number} maxRole - Rol máximo (inclusive) permitido
 */
const requireRole = (maxRole) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || role > maxRole) {
    return res.status(403).json({
      error: `Acceso denegado: se requiere rol ≤ ${maxRole}`,
    });
  }
  next();
};

/**
 * Acceso general al panel: roles 1, 2 y 3.
 * Bloquea usuarios normales (role 4).
 */
const panelAuth = requireRole(3);

module.exports = { requireRole, panelAuth };
