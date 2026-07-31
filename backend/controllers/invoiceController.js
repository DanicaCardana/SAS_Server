const pool = require('../config/db');

// Helper to generate unique invoice numbers
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
};

// @desc    Generate invoice for a booking (Cashier / Admin)
// @route   POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const { booking_id, tax, discount } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    // Check if invoice already exists for this booking
    const [existing] = await pool.query('SELECT id FROM invoices WHERE booking_id = ?', [booking_id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An invoice already exists for this booking', invoice_id: existing[0].id });
    }

    // Get booking & service price
    const [bookings] = await pool.query(
      `SELECT b.id, b.client_id, s.price 
       FROM bookings b 
       JOIN services s ON b.service_id = s.id 
       WHERE b.id = ?`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];
    const subtotal = parseFloat(booking.price);
    const taxAmt = parseFloat(tax || 0.00);
    const discountAmt = parseFloat(discount || 0.00);
    const totalAmount = Math.max(0, subtotal + taxAmt - discountAmt);
    const invoiceNum = generateInvoiceNumber();
    const cashierId = (req.user.role_name === 'CASHIER' || req.user.role_name === 'ADMIN') ? req.user.id : null;

    const [result] = await pool.query(
      `INSERT INTO invoices (invoice_number, booking_id, client_id, cashier_id, subtotal, tax, discount, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID')`,
      [invoiceNum, booking_id, booking.client_id, cashierId, subtotal, taxAmt, discountAmt, totalAmount]
    );

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        id: result.insertId,
        invoice_number: invoiceNum,
        booking_id,
        subtotal,
        tax: taxAmt,
        discount: discountAmt,
        total_amount: totalAmount,
        status: 'UNPAID'
      }
    });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating invoice', error: error.message });
  }
};

// @desc    Get all invoices (Role filtered)
// @route   GET /api/invoices
const getInvoices = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    let query = `
      SELECT i.id, i.invoice_number, i.booking_id, i.client_id, 
             CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email,
             i.cashier_id, CONCAT(c.first_name, ' ', c.last_name) AS cashier_name,
             s.name AS service_name, i.subtotal, i.tax, i.discount, i.total_amount, i.status, i.created_at
      FROM invoices i
      JOIN users u ON i.client_id = u.id
      LEFT JOIN users c ON i.cashier_id = c.id
      JOIN bookings b ON i.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role_name === 'CLIENT') {
      query += ` AND i.client_id = ?`;
      params.push(req.user.id);
    } else if (client_id) {
      query += ` AND i.client_id = ?`;
      params.push(client_id);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY i.created_at DESC`;

    const [invoices] = await pool.query(query, params);
    return res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching invoices', error: error.message });
  }
};

// @desc    Get single invoice detail
// @route   GET /api/invoices/:id
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [invoices] = await pool.query(
      `SELECT i.id, i.invoice_number, i.booking_id, i.client_id, 
              CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
              i.cashier_id, CONCAT(c.first_name, ' ', c.last_name) AS cashier_name,
              s.name AS service_name, s.duration_minutes, i.subtotal, i.tax, i.discount, i.total_amount, i.status, i.created_at
       FROM invoices i
       JOIN users u ON i.client_id = u.id
       LEFT JOIN users c ON i.cashier_id = c.id
       JOIN bookings b ON i.booking_id = b.id
       JOIN services s ON b.service_id = s.id
       WHERE i.id = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = invoices[0];

    // Client ownership authorization check
    if (req.user.role_name === 'CLIENT' && invoice.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice' });
    }

    // Fetch payment records if paid
    const [payments] = await pool.query('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC', [id]);
    invoice.payments = payments;

    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get Invoice By Id Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching invoice detail', error: error.message });
  }
};

module.exports = { createInvoice, getInvoices, getInvoiceById };
