const pool = require('../config/db');

// Helper to generate unique invoice numbers
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
};

// @desc    Generate invoice for one or more bookings (Continuous / Cumulative Billing)
// @route   POST /api/invoices
const createInvoice = async (req, res) => {
  try {
    const { booking_id, booking_ids, tax, discount } = req.body;

    const ids = Array.isArray(booking_ids) && booking_ids.length > 0
      ? booking_ids
      : (booking_id ? [booking_id] : []);

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one booking ID is required' });
    }

    // Fetch booking details & service price & staff
    const [bookings] = await pool.query(
      `SELECT b.id, b.client_id, b.service_id, s.name AS service_name, s.price,
              b.staff_id, CONCAT(st.first_name, ' ', st.last_name) AS staff_name, st.client_number AS staff_number, r.name AS staff_role
       FROM bookings b 
       JOIN services s ON b.service_id = s.id 
       LEFT JOIN users st ON b.staff_id = st.id
       LEFT JOIN roles r ON st.role_id = r.id
       WHERE b.id IN (?)`,
      [ids]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid bookings found for the provided IDs' });
    }

    const clientId = bookings[0].client_id;
    // Calculate subtotal from all items
    const subtotal = bookings.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);
    const taxAmt = parseFloat(tax || 0.00);
    const discountAmt = parseFloat(discount || 0.00);
    const totalAmount = Math.max(0, subtotal + taxAmt - discountAmt);
    const invoiceNum = generateInvoiceNumber();
    const cashierId = (req.user.role_name === 'CASHIER' || req.user.role_name === 'ADMIN') ? req.user.id : null;
    const primaryBookingId = bookings.length === 1 ? bookings[0].id : null;

    // Insert invoice
    const [result] = await pool.query(
      `INSERT INTO invoices (invoice_number, booking_id, client_id, cashier_id, subtotal, tax, discount, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID')`,
      [invoiceNum, primaryBookingId, clientId, cashierId, subtotal, taxAmt, discountAmt, totalAmount]
    );

    const invoiceId = result.insertId;

    // Insert line items
    for (const b of bookings) {
      const staffDisplay = b.staff_name ? `${b.staff_name}${b.staff_role ? ' (' + b.staff_role.replace(/_/g, ' ') + ')' : ''}` : null;
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, booking_id, service_id, staff_id, service_name, staff_name, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, b.id, b.service_id, b.staff_id || null, b.service_name, staffDisplay, b.price]
      );
    }

    return res.status(201).json({
      success: true,
      message: `Invoice created successfully with ${bookings.length} service item(s)`,
      data: {
        id: invoiceId,
        invoice_number: invoiceNum,
        booking_id: primaryBookingId,
        client_id: clientId,
        subtotal,
        tax: taxAmt,
        discount: discountAmt,
        total_amount: totalAmount,
        status: 'UNPAID',
        item_count: bookings.length
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
      SELECT i.id, i.invoice_number, i.booking_id, i.client_id, u.client_number,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
             i.cashier_id, CONCAT(c.first_name, ' ', c.last_name) AS cashier_name,
             COALESCE(
               (SELECT GROUP_CONCAT(CONCAT(ii.service_name, IF(ii.staff_name IS NOT NULL, CONCAT(' [', ii.staff_name, ']'), '')) SEPARATOR ', ')
                FROM invoice_items ii WHERE ii.invoice_id = i.id),
               s.name,
               'Salon Services'
             ) AS service_name,
             i.subtotal, i.tax, i.discount, i.total_amount, i.status, i.created_at
      FROM invoices i
      JOIN users u ON i.client_id = u.id
      LEFT JOIN users c ON i.cashier_id = c.id
      LEFT JOIN bookings b ON i.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
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

    // Fetch line items for each invoice
    if (invoices.length > 0) {
      const invoiceIds = invoices.map(x => x.id);
      const [items] = await pool.query(
        `SELECT ii.*, st.client_number AS staff_number, r.name AS staff_role
         FROM invoice_items ii
         LEFT JOIN users st ON ii.staff_id = st.id
         LEFT JOIN roles r ON st.role_id = r.id
         WHERE ii.invoice_id IN (?)`,
        [invoiceIds]
      );
      const itemMap = {};
      items.forEach(it => {
        if (!itemMap[it.invoice_id]) itemMap[it.invoice_id] = [];
        itemMap[it.invoice_id].push(it);
      });
      invoices.forEach(inv => {
        inv.items = itemMap[inv.id] || [];
      });
    }

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
      `SELECT i.id, i.invoice_number, i.booking_id, i.client_id, u.client_number,
              CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email, u.phone AS client_phone,
              i.cashier_id, CONCAT(c.first_name, ' ', c.last_name) AS cashier_name,
              i.subtotal, i.tax, i.discount, i.total_amount, i.status, i.created_at
       FROM invoices i
       JOIN users u ON i.client_id = u.id
       LEFT JOIN users c ON i.cashier_id = c.id
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

    // Fetch line items
    const [items] = await pool.query(
      `SELECT ii.*, st.client_number AS staff_number, r.name AS staff_role
       FROM invoice_items ii
       LEFT JOIN users st ON ii.staff_id = st.id
       LEFT JOIN roles r ON st.role_id = r.id
       WHERE ii.invoice_id = ?`,
      [id]
    );
    invoice.items = items;

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
