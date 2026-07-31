const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.post('/', authorizeRoles('ADMIN', 'CASHIER'), createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

module.exports = router;
