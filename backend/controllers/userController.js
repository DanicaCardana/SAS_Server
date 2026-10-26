const bcrypt = require('bcryptjs');
const { generateUserNumber } = require('../utils/numberGenerator');
const pool = require('../config/db');

// @desc    Get all users (Admin only)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = `
      SELECT u.id, u.role_id, r.name AS role_name, u.client_number, u.first_name, u.last_name, u.middle_name,
             u.email, u.phone, u.gender, u.civil_status, u.birthdate, u.home_address,
             u.plain_password, u.status, u.created_at
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

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ` AND (u.client_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q);
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

    const [userRows] = await pool.query('SELECT id, client_number, first_name, last_name, email, password_hash, plain_password, status FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userRows[0];
    const newStatus = status.toUpperCase();
    let generatedPassword = null;

    // Preserve temporary password generated on registration or generate if missing
    if (newStatus === 'APPROVED') {
      if (targetUser.plain_password && targetUser.password_hash) {
        generatedPassword = targetUser.plain_password;
        await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);
      } else {
        const f = (targetUser.first_name || '').trim().toLowerCase().replace(/\s+/g, '');
        const l = (targetUser.last_name || '').trim().toLowerCase().replace(/\s+/g, '');
        generatedPassword = (f && l) ? `${f}${l}123` : 'client123';

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(generatedPassword, salt);

        await pool.query(
          'UPDATE users SET status = ?, password_hash = ?, plain_password = ?, updated_at = NOW() WHERE id = ?',
          [newStatus, password_hash, generatedPassword, id]
        );
      }
    } else {
      await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);
    }

    return res.json({
      success: true,
      message: `User registration status updated to ${newStatus}${generatedPassword ? '. Password: ' + generatedPassword : ''}`,
      data: {
        id: parseInt(id),
        client_number: targetUser.client_number,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        email: targetUser.email,
        plain_password: generatedPassword,
        status: newStatus,
        generated_password: generatedPassword
      }
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
    const { first_name, last_name, middle_name, phone, gender, civil_status, birthdate, home_address } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, middle_name = ?, phone = ?, gender = ?, civil_status = ?, birthdate = ?, home_address = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        first_name || req.user.first_name,
        last_name || req.user.last_name,
        middle_name !== undefined ? middle_name : (req.user.middle_name || null),
        phone || req.user.phone,
        gender || req.user.gender || null,
        civil_status || req.user.civil_status || null,
        birthdate || req.user.birthdate || null,
        home_address || req.user.home_address || null,
        userId
      ]
    );

    const [updated] = await pool.query(
      `SELECT u.id, u.role_id, r.name AS role_name, u.client_number, u.first_name, u.last_name, u.middle_name,
              u.email, u.phone, u.gender, u.civil_status, u.birthdate, u.home_address, u.status
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

// @desc    Change authenticated user's password
// @route   PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id;

    if (!new_password || new_password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentHash = rows[0].password_hash;

    // If account has an existing password, verify current_password
    if (currentHash) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(current_password, currentHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password.trim(), salt);

    await pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, userId]);

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error changing password', error: error.message });
  }
};

// @desc    Create a new staff account directly (Admin only)
// @route   POST /api/users/create-staff
const createStaff = async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, email, phone,
      gender, civil_status, birthdate, home_address,
      password, role_name
    } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and password are required' });
    }

    const targetRole = (role_name || 'CASHIER').toUpperCase();
    if (!['CASHIER', 'ADMIN'].includes(targetRole)) {
      return res.status(400).json({ success: false, message: 'Staff role must be CASHIER or ADMIN' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check role exists
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [targetRole]);
    if (roles.length === 0) {
      return res.status(400).json({ success: false, message: `Role not found: ${targetRole}` });
    }
    const role_id = roles[0].id;

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    // Auto-generate STF-YYYY-XXXX number
    const client_number = await generateUserNumber(pool, targetRole);

    // Hash the admin-provided password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password.trim(), salt);

    const formattedGender = gender ? gender.toUpperCase() : null;
    const formattedCivilStatus = civil_status ? civil_status.toUpperCase() : null;
    const formattedAddress = (home_address || '').trim() || null;
    const formattedBirthdate = birthdate || null;

    const [result] = await pool.query(
      `INSERT INTO users
         (role_id, client_number, first_name, last_name, middle_name, email, phone,
          password_hash, gender, civil_status, birthdate, home_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [
        role_id,
        client_number,
        first_name.trim(),
        last_name.trim(),
        middle_name ? middle_name.trim() : null,
        email.trim(),
        phone ? phone.trim() : null,
        password_hash,
        formattedGender,
        formattedCivilStatus,
        formattedBirthdate,
        formattedAddress
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Staff account created successfully with ID ${client_number}`,
      data: {
        id: result.insertId,
        client_number,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        role_name: targetRole,
        status: 'APPROVED'
      }
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating staff account', error: error.message });
  }
};

// @desc    Admin reset client/user password (auto-pattern or custom)
// @route   PUT /api/users/:id/reset-password
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const [userRows] = await pool.query(
      'SELECT id, client_number, first_name, last_name, email, role_id, status FROM users WHERE id = ?',
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userRows[0];
    let plainPassword = '';

    if (new_password && new_password.trim()) {
      if (new_password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      }
      plainPassword = new_password.trim();
    } else {
      // Auto-generate default pattern: firstname + lastname + 123
      const f = (targetUser.first_name || '').trim().toLowerCase().replace(/\s+/g, '');
      const l = (targetUser.last_name || '').trim().toLowerCase().replace(/\s+/g, '');
      plainPassword = (f && l) ? `${f}${l}123` : (f || l ? `${f || l}123` : 'client123');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(plainPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = ?, plain_password = ?, updated_at = NOW() WHERE id = ?',
      [password_hash, plainPassword, id]
    );

    return res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        id: targetUser.id,
        client_number: targetUser.client_number,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        email: targetUser.email,
        plain_password: plainPassword
      }
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password', error: error.message });
  }
};

module.exports = { getUsers, updateUserStatus, updateProfile, changePassword, createStaff, resetPassword };
