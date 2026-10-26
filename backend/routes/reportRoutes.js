const express = require('express');
const router = express.Router();
const { getDashboardOverview, getSalesReport, getPublicStats } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public — no authentication required (used by landing page)
router.get('/public-stats', getPublicStats);

// All routes below require a valid JWT
router.use(authenticateToken);

router.get('/overview', authorizeRoles('ADMIN', 'CASHIER'), getDashboardOverview);
router.get('/sales', authorizeRoles('ADMIN'), getSalesReport);

module.exports = router;
