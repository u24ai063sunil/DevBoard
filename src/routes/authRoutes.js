const express = require('express');
const router = express.Router();

const { register, login, refreshToken, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidators');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',  refreshToken);
router.post('/logout',   logout);

// Protected route — must send valid access token
router.get('/me', protect, getMe);

module.exports = router;