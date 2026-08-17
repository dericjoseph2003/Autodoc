const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getProfile, updateProfile, forgotPassword, resetPassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validators');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting and input validation
router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;

