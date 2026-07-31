const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user profile attached' });
    }

    const rolesList = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    const userRole = req.user.role_name.toUpperCase();

    if (!rolesList.map(r => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${rolesList.join(', ')}] roles`
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
