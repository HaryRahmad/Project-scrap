const router = require('express').Router();
const AuthController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// GET /api/auth/me (protected)
router.get('/me', require('../middlewares/auth'), AuthController.getMe);

module.exports = router;
