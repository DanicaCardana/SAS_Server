const pool = require('../config/db');

// @desc    Create a new booking or walk-in availment
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { service_id, client_id, type, booking_date, time_slot, notes } = req.body;

    // Determine target client_id
    const targetClientId = req.user.role_name === 'CLIENT' ? req.user.id : client_id;

    if (!service_id || !targetClientId || !booking_date || !time_slot) {
      return res.status(400).json({ success: false, message: 'Service, client, booking date, and time slot are required' });
    }

    // Check service validity
    const [services] = await pool.query('SELECT price, status FROM services WHERE id = ?', [service_id]);
    if (services.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected service not found' });
    }

    if (services[0].status === 'UNAVAILABLE') {
      return res.status(400).json({ success: false, message: 'Selected service is currently unavailable' });
    }

    const bookingType = (type || (req.user.role_name === 'CASHIER' ? 'WALK_IN' : 'ONLINE_BOOKING')).toUpperCase();
    const initialStatus = bookingType === 'WALK_IN' ? 'CONFIRMED' : 'PENDING';

    const [result] = await pool.query(
      `INSERT INTO bookings (client_id, service_id, type, booking_date, time_slot, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [targetClientId, service_id, bookingType, booking_date, time_slot, initialStatus, notes || '']
    );

    return res.status(201).json({
      success: true,
      message: `${bookingType === 'WALK_IN' ? 'Walk-in service availed' : 'Service booking reserved'} successfully`,
      data: {
        id: result.insertId,
        client_id: targetClientId,
        service_id,
        type: bookingType,
        booking_date,
        time_slot,
        status: initialStatus
      }
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating booking', error: error.message });
  }
};

// @desc    Get bookings list (Role filtered)
// @route   GET /api/bookings
const getBookings = async (req, res) => {
  try {
    const { status, type, date, client_id } = req.query;
    let query = `
      SELECT b.id, b.client_id, CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
             b.service_id, s.name AS service_name, s.price AS service_price, s.duration_minutes,
             b.type, b.booking_date, b.time_slot, b.status, b.notes, b.created_at
      FROM bookings b
      JOIN users u ON b.client_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based visibility scoping
    if (req.user.role_name === 'CLIENT') {
      query += ` AND b.client_id = ?`;
      params.push(req.user.id);
    } else if (client_id) {
      query += ` AND b.client_id = ?`;
      params.push(client_id);
    }

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status.toUpperCase());
    }

    if (type) {
      query += ` AND b.type = ?`;
      params.push(type.toUpperCase());
    }

    if (date) {
      query += ` AND b.booking_date = ?`;
      params.push(date);
    }

    query += ` ORDER BY b.booking_date DESC, b.time_slot DESC`;

    const [bookings] = await pool.query(query, params);
    return res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Get Bookings Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching bookings', error: error.message });
  }
};

// @desc    Update booking status (Admin / Cashier / Client for cancellation)
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const [bookings] = await pool.query('SELECT client_id FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking record not found' });
    }

    // Clients can only cancel their own bookings
    if (req.user.role_name === 'CLIENT') {
      if (bookings[0].client_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this booking' });
      }
      if (status.toUpperCase() !== 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'Clients can only cancel their own bookings' });
      }
    }

    await pool.query('UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?', [status.toUpperCase(), id]);

    return res.json({ success: true, message: `Booking status updated to ${status.toUpperCase()}`, id: parseInt(id) });
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating booking status', error: error.message });
  }
};

module.exports = { createBooking, getBookings, updateBookingStatus };
