const { body, validationResult } = require('express-validator');

/**
 * Handle express-validator errors and return them in a standard format
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Registration Validation Rules
 */
const registerValidation = [
  body().custom((value, { req }) => {
    const nameVal = req.body.user_full_name || req.body.name;
    if (!nameVal || typeof nameVal !== 'string' || nameVal.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long');
    }
    const emailVal = req.body.user_email || req.body.email;
    if (!emailVal || typeof emailVal !== 'string' || !emailVal.includes('@')) {
      throw new Error('Enter a valid email address');
    }
    if (!req.body.googleId) {
      const passVal = req.body.user_password_hash || req.body.password;
      if (!passVal || typeof passVal !== 'string' || passVal.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
    }
    return true;
  }),
  handleValidationErrors
];

/**
 * Login Validation Rules
 */
const loginValidation = [
  body().custom((value, { req }) => {
    const emailVal = req.body.user_email || req.body.email;
    if (!emailVal || typeof emailVal !== 'string' || !emailVal.includes('@')) {
      throw new Error('Enter a valid email address');
    }
    const passVal = req.body.user_password_hash || req.body.password;
    if (!passVal || typeof passVal !== 'string' || passVal.trim() === '') {
      throw new Error('Password is required');
    }
    return true;
  }),
  handleValidationErrors
];

/**
 * Forgot Password Validation Rules
 */
const forgotPasswordValidation = [
  body().custom((value, { req }) => {
    const emailVal = req.body.user_email || req.body.email;
    if (!emailVal || typeof emailVal !== 'string' || !emailVal.includes('@')) {
      throw new Error('Enter a valid email address');
    }
    return true;
  }),
  handleValidationErrors
];

/**
 * Reset Password Validation Rules
 */
const resetPasswordValidation = [
  body().custom((value, { req }) => {
    const emailVal = req.body.user_email || req.body.email;
    if (!emailVal || typeof emailVal !== 'string' || !emailVal.includes('@')) {
      throw new Error('Enter a valid email address');
    }
    if (!req.body.otp || req.body.otp.trim().length !== 6) {
      throw new Error('OTP must be a 6-digit code');
    }
    const newPass = req.body.user_password_hash || req.body.newPassword;
    if (!newPass || typeof newPass !== 'string' || newPass.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    return true;
  }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};
