/**
 * @file routes/accounts.js
 * @description Rutas protegidas para gestión de cuentas bancarias.
 * Todas requieren token JWT válido (middleware `auth`).
 *
 * POST /api/accounts              → crea una nueva cuenta para el usuario autenticado
 * GET  /api/accounts              → lista todas las cuentas activas del usuario
 * GET  /api/accounts/:id/balance  → devuelve el saldo de una cuenta específica
 */

const router                             = require('express').Router();
const auth                               = require('../middleware/auth');
const { create, getMyAccounts, getBalance } = require('../controllers/accountController');
const { validate, rules }                = require('../middlewares/validate');

// Orden de middlewares: auth verifica identidad → validate verifica datos → controlador actúa
router.post('/',           auth, validate(rules.createAccount), create);
router.get('/',            auth, getMyAccounts);
router.get('/:id/balance', auth, getBalance);

module.exports = router;
