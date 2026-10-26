const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sas_super_secret_jwt_key_2026_salon_spa_app');

    // Fetch user details from DB to ensure account is still active and approved
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, r.name AS role_name, u.client_number, u.first_name, u.last_name, u.email, u.status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const user = rows[0];

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Account registration is pending Admin approval or rejected' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication Error:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
