const rateLimit = require('express-rate-limit');

const isLocalOrDev = (req) => {
  return process.env.NODE_ENV === 'development' || 
         req.ip === '127.0.0.1' || 
         req.ip === '::1' || 
         req.ip === '::ffff:127.0.0.1';
};

/**
 * Limit login attempts to protect against brute-force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDev
});

/**
 * Limit registration requests to prevent abuse
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 registrations per hour
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDev
});

module.exports = {
  loginLimiter,
  registerLimiter
};
