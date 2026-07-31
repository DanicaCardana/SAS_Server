const pool = require('../config/db');

// @desc    Get all users (Admin only)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = `
      SELECT u.id, u.role_id, r.name AS role_name, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND r.name = ?`;
      params.push(role.toUpperCase());
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY u.created_at DESC`;

    const [users] = await pool.query(query, params);
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get Users Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users', error: error.message });
  }
};

// @desc    Update user registration approval status (Admin only)
// @route   PUT /api/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status ? status.toUpperCase() : '')) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED, REJECTED, or PENDING' });
    }

    const [user] = await pool.query('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status.toUpperCase(), id]);

    return res.json({
      success: true,
      message: `User registration status updated to ${status.toUpperCase()}`,
      data: { id: parseInt(id), status: status.toUpperCase() }
    });
  } catch (error) {
    console.error('Update User Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user status', error: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW() WHERE id = ?`,
      [first_name || req.user.first_name, last_name || req.user.last_name, phone || req.user.phone, userId]
    );

    const [updated] = await pool.query(
      `SELECT u.id, u.role_id, r.name AS role_name, u.first_name, u.last_name, u.email, u.phone, u.status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile', error: error.message });
  }
};

module.exports = { getUsers, updateUserStatus, updateProfile };
