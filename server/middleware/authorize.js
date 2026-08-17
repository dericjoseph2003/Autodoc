/**
 * Middleware to restrict route access by user roles
 * @param {...string} allowedRoles 
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.user_role || req.user?.role;
    if (!req.user || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user credentials or role missing'
      });
    }

    const normalizedAllowed = allowedRoles.map(r => r === 'serviceCenter' ? 'service_center' : r);

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${userRole}' is not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = authorize;
