const express = require('express');
const router = express.Router();
const { getCategories, getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public / Authenticated read routes
router.get('/categories', getCategories);
router.get('/', getServices);

// Admin-only management routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createService);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateService);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteService);

module.exports = router;
