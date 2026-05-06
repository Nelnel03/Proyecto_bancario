const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, getById } = require('../controllers/userController');

router.get('/', auth, getAll);
router.get('/:id', auth, getById);

module.exports = router;
