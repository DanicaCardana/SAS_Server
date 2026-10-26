const pool = require('../config/db');

// @desc    Process payment transaction for an invoice (Cashier / Admin / Client online)
// @route   POST /api/payments
const processPayment = async (req, res) => {
  try {
    const { invoice_id, payment_method, amount_paid, transaction_ref } = req.body;

    if (!invoice_id || !amount_paid) {
      return res.status(400).json({ success: false, message: 'Invoice ID and amount paid are required' });
    }

    // Fetch invoice details
    const [invoices] = await pool.query('SELECT id, booking_id, total_amount, status FROM invoices WHERE id = ?', [invoice_id]);
    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = invoices[0];
    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Invoice is already marked as PAID' });
    }

    const totalAmt = parseFloat(invoice.total_amount);
    const paidAmt = parseFloat(amount_paid);

    if (paidAmt < totalAmt) {
      return res.status(400).json({
        success: false,
        message: `Insufficient payment amount. Total due: ₱${totalAmt.toFixed(2)}, Paid: ₱${paidAmt.toFixed(2)}`
      });
    }

    const changeAmt = paidAmt - totalAmt;
    const method = (payment_method || 'CASH').toUpperCase();
    const refCode = transaction_ref || `${method}-REF-${Date.now()}`;

    // 1. Insert payment record
    const [payResult] = await pool.query(
      `INSERT INTO payments (invoice_id, payment_method, amount_paid, change_amount, transaction_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [invoice_id, method, paidAmt, changeAmt, refCode]
    );

    // 2. Update invoice status to 'PAID'
    await pool.query(
      `UPDATE invoices SET status = 'PAID', cashier_id = COALESCE(cashier_id, ?), updated_at = NOW() WHERE id = ?`,
      [req.user.role_name === 'CLIENT' ? null : req.user.id, invoice_id]
    );

    // 3. Update associated booking status to 'COMPLETED'
    await pool.query(
      `UPDATE bookings SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?`,
      [invoice.booking_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Payment processed successfully! Invoice updated to PAID.',
      data: {
        payment_id: payResult.insertId,
        invoice_id,
        payment_method: method,
        amount_paid: paidAmt,
        change_amount: changeAmt,
        transaction_ref: refCode
      }
    });
  } catch (error) {
    console.error('Process Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing payment', error: error.message });
  }
};

// @desc    Get payment history logs (Role filtered)
// @route   GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    let query = `
      SELECT p.id AS payment_id, p.invoice_id, i.invoice_number, i.client_id, u.client_number,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.email AS client_email,
             s.name AS service_name, p.payment_method, p.amount_paid, p.change_amount,
             i.total_amount, p.transaction_ref, p.paid_at
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN users u ON i.client_id = u.id
      JOIN bookings b ON i.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role_name === 'CLIENT') {
      query += ` AND i.client_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.paid_at DESC`;

    const [payments] = await pool.query(query, params);
    return res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    console.error('Get Payment History Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving payment history', error: error.message });
  }
};

module.exports = { processPayment, getPaymentHistory };
