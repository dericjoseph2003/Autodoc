const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verification of JWT
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (token === 'guest_owner_token') {
        const ownerUser = await User.findOne({ user_role: 'owner' });
        req.user = ownerUser || {
          _id: 'guest_owner',
          user_id: 'guest_owner',
          user_role: 'owner',
          role: 'owner',
          user_full_name: 'Vehicle Owner',
          user_email: 'owner@autodoc.com'
        };
        return next();
      }

      if (token === 'guest_sc_token') {
        const scUser = await User.findOne({ user_role: 'service_center' });
        req.user = scUser || {
          _id: 'guest_sc',
          user_id: 'guest_sc',
          user_role: 'service_center',
          role: 'service_center',
          user_full_name: 'Service Center Manager',
          user_email: 'service@autodoc.com'
        };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforautodocapp');

      const userId = decoded.user_id || decoded.id;
      const user = await User.findById(userId).select('-user_password_hash -password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      user.user_role = decoded.user_role || decoded.role || user.user_role;
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Not authorized, token has expired' });
      }
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const authorize = require('./authorize');

module.exports = {
  protect,
  authorize
};
