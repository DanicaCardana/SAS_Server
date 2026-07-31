const express = require('express');
const router = express.Router();
const { getDashboardOverview, getSalesReport } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/overview', authorizeRoles('ADMIN', 'CASHIER'), getDashboardOverview);
router.get('/sales', authorizeRoles('ADMIN'), getSalesReport);

module.exports = router;
