const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateProfile, changePassword, createStaff, resetPassword, getStaff } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Staff list for assigning services (Admin & Cashier)
router.get('/staff', authorizeRoles('ADMIN', 'CASHIER'), getStaff);

// Admin-only endpoints
router.get('/', authorizeRoles('ADMIN', 'CASHIER'), getUsers);
router.put('/:id/status', authorizeRoles('ADMIN'), updateUserStatus);
router.put('/:id/reset-password', authorizeRoles('ADMIN'), resetPassword);
router.post('/create-staff', authorizeRoles('ADMIN'), createStaff);

// Self user profile and password update
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
