const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus } = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', createBooking);
router.get('/', getBookings);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
