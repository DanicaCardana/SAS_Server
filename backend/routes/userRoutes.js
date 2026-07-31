const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Admin-only endpoints
router.get('/', authorizeRoles('ADMIN'), getUsers);
router.put('/:id/status', authorizeRoles('ADMIN'), updateUserStatus);

// Self user profile update
router.put('/profile', updateProfile);

module.exports = router;
