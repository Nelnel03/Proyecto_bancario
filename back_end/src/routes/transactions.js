/**
 * @file routes/transactions.js
 * @description Rutas protegidas para operaciones financieras.
 * Todas requieren token JWT válido (middleware `auth`).
 *
 * POST /api/transactions/deposit              → deposita en cualquier cuenta activa
 * POST /api/transactions/withdrawal           → retira de una cuenta propia
 * POST /api/transactions/transfer             → transfiere entre cuentas
 * GET  /api/transactions/account/:accountId   → historial de una cuenta propia
 */

const router                                        = require('express').Router();
const auth                                          = require('../middleware/auth');
const { deposit, withdrawal, transfer, getHistory } = require('../controllers/transactionController');
const { validate, rules }                           = require('../middlewares/validate');

// Orden: auth → validate → controlador
router.post('/deposit',    auth, validate(rules.deposit),    deposit);
router.post('/withdrawal', auth, validate(rules.withdrawal), withdrawal);
router.post('/transfer',   auth, validate(rules.transfer),   transfer);
router.get('/account/:accountId', auth, getHistory);

module.exports = router;
