const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', processPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
