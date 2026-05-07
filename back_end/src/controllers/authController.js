/**
 * @file authController.js
 * @description Controladores de autenticación: registro e inicio de sesión.
 *
 * Flujo general:
 *   1. El middleware `validate` (en las rutas) ya verificó que los campos
 *      llegaron correctos. Este controlador asume datos limpios.
 *   2. Se aplica lógica de negocio: unicidad de email, hash de contraseña, JWT.
 *   3. Se responde usando los helpers de `utils/response`.
 */

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User } = require('../models');
const { ok, fail } = require('../utils/response');

/**
 * Genera un JWT firmado con los datos básicos del usuario.
 * El payload incluye `id`, `email` y `role` para que los middlewares
 * de autorización puedan verificar permisos sin consultar la BD.
 *
 * @param {object} user        - Instancia de User de Sequelize
 * @param {string} user.id     - UUID del usuario
 * @param {string} user.email  - Email del usuario
 * @param {string} user.role   - Rol del usuario ('user' | 'admin')
 * @returns {string} Token JWT firmado
 */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema.
 *
 * Reglas de negocio:
 *   - El email debe ser único en la base de datos.
 *   - La contraseña se almacena hasheada con bcrypt (nunca en texto plano).
 *   - Se devuelve un JWT para que el cliente pueda operar de inmediato.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.register = async (req, res) => {
  const { full_name, email, password } = req.body;

  // Verificar unicidad del email antes de intentar insertar
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return fail(res, 'El email ya está registrado', 409);
  }

  // bcrypt.hash(password, saltRounds): 10 rondas es el estándar recomendado;
  // es suficientemente lento para dificultar ataques de fuerza bruta sin
  // impactar notablemente el tiempo de respuesta al usuario.
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ full_name, email, password_hash });

  return ok(
    res,
    { token: signToken(user), user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } },
    'Usuario registrado exitosamente',
    201
  );
};

/**
 * POST /api/auth/login
 * Autentica a un usuario existente y devuelve un JWT.
 *
 * Reglas de negocio:
 *   - Respondemos con el mismo mensaje "Credenciales inválidas" tanto si el
 *     email no existe como si la contraseña es incorrecta. Esto evita que un
 *     atacante pueda enumerar usuarios válidos (user enumeration).
 *   - Las cuentas desactivadas (is_active = false) son rechazadas igual que
 *     las no existentes.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  // Mensaje genérico intencionalmente: no revelar si el email existe o no
  if (!user || !user.is_active) {
    return fail(res, 'Credenciales inválidas', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return fail(res, 'Credenciales inválidas', 401);
  }

  return ok(
    res,
    { token: signToken(user), user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } },
    'Login exitoso'
  );
};
