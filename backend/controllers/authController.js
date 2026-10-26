const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateUserNumber } = require('../utils/numberGenerator');

// @desc    Register a new user (Client or Cashier) -> Defaults to PENDING status
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      home_address,
      address,
      gender,
      civil_status,
      status: req_status,
      birthdate,
      email,
      phone,
      password,
      role_name
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required' });
    }

    // Determine target role (default to CLIENT if not specified)
    const targetRoleName = (role_name || 'CLIENT').toUpperCase();
    const [roles] = await pool.query('SELECT id FROM roles WHERE name = ?', [targetRoleName]);

    if (roles.length === 0) {
      return res.status(400).json({ success: false, message: `Invalid role specified: ${targetRoleName}` });
    }

    const role_id = roles[0].id;

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    // Auto-generate client or staff number
    const client_number = await generateUserNumber(pool, targetRoleName);

    // Auto-generate temporary password on registration if not supplied
    const f = (first_name || '').trim().toLowerCase().replace(/\s+/g, '');
    const l = (last_name || '').trim().toLowerCase().replace(/\s+/g, '');
    const plain_password = (password && password.trim())
      ? password.trim()
      : ((f && l) ? `${f}${l}123` : 'client123');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(plain_password, salt);

    const formattedAddress = (home_address || address || '').trim() || null;
    const formattedGender = gender ? gender.toUpperCase() : null;
    const resolvedCivilStatus = civil_status
      ? civil_status.toUpperCase()
      : (req_status && ['SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED', 'OTHER'].includes(req_status.toUpperCase()) ? req_status.toUpperCase() : null);
    const formattedBirthdate = birthdate || null;

    // Insert new user with status 'PENDING'
    const [result] = await pool.query(
      `INSERT INTO users (role_id, client_number, first_name, last_name, middle_name, email, phone, password_hash, plain_password, gender, civil_status, birthdate, home_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        role_id,
        client_number,
        first_name.trim(),
        last_name.trim(),
        middle_name ? middle_name.trim() : null,
        email.trim(),
        phone ? phone.trim() : null,
        password_hash,
        plain_password,
        formattedGender,
        resolvedCivilStatus,
        formattedBirthdate,
        formattedAddress
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Account submitted for Admin approval.',
      data: {
        id: result.insertId,
        client_number,
        first_name,
        last_name,
        middle_name: middle_name || null,
        email,
        plain_password,
        role_name: targetRoleName,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & return JWT token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Fetch user & role details
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, r.name AS role_name, u.client_number, u.first_name, u.last_name, u.email, u.password_hash, u.status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Check registration approval status BEFORE password verification
    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Your account registration is pending Admin approval. A password will be generated once approved.'
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        message: 'Your registration request has been rejected by the administrator.'
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Your account does not have a password set. Please contact the salon administrator.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, role_id: user.role_id, role_name: user.role_name, client_number: user.client_number, email: user.email },
      process.env.JWT_SECRET || 'sas_super_secret_jwt_key_2026_salon_spa_app',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        role_id: user.role_id,
        role_name: user.role_name,
        client_number: user.client_number,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Get current authenticated session profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

module.exports = { register, login, getMe };
