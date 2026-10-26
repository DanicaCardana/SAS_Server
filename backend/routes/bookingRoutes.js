const express = require('express');
const router = express.Router();
const { createBooking, getBookings, updateBookingStatus, getBookedSlots } = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/slots', getBookedSlots);   // must be before /:id routes
router.post('/', createBooking);
router.get('/', getBookings);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
