/**
 * @file routes/auth.js
 * @description Rutas públicas de autenticación (no requieren JWT).
 *
 * POST /api/auth/register  → valida campos → registra usuario
 * POST /api/auth/login     → valida campos → autentica usuario
 */

const router                    = require('express').Router();
const { register, login }       = require('../controllers/authController');
const { validate, rules }       = require('../middlewares/validate');

// El middleware `validate` se ejecuta primero; si los datos son inválidos responde
// con HTTP 400 y el controlador nunca se ejecuta.
router.post('/register', validate(rules.register), register);
router.post('/login',    validate(rules.login),    login);

module.exports = router;
