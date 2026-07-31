const pool = require('../config/db');

// @desc    Get dashboard overview statistics (Admin & Cashier)
// @route   GET /api/reports/overview
const getDashboardOverview = async (req, res) => {
  try {
    // 1. Walk-in count vs Online booking count
    const [bookingCounts] = await pool.query(
      `SELECT 
         SUM(CASE WHEN type = 'WALK_IN' THEN 1 ELSE 0 END) AS walk_in_count,
         SUM(CASE WHEN type = 'ONLINE_BOOKING' THEN 1 ELSE 0 END) AS online_booking_count,
         COUNT(*) AS total_bookings
       FROM bookings`
    );

    // 2. Pending user registrations count
    const [pendingUsers] = await pool.query(
      `SELECT COUNT(*) AS pending_count FROM users WHERE status = 'PENDING'`
    );

    // 3. Client & Cashier account totals
    const [userCounts] = await pool.query(
      `SELECT 
         SUM(CASE WHEN r.name = 'CLIENT' THEN 1 ELSE 0 END) AS total_clients,
         SUM(CASE WHEN r.name = 'CASHIER' THEN 1 ELSE 0 END) AS total_cashiers
       FROM users u
       JOIN roles r ON u.role_id = r.id`
    );

    // 4. Total revenue collected from paid invoices
    const [revenue] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM invoices WHERE status = 'PAID'`
    );

    // 5. Total available services
    const [servicesCount] = await pool.query(
      `SELECT COUNT(*) AS total_services FROM services WHERE status = 'AVAILABLE'`
    );

    return res.json({
      success: true,
      data: {
        walk_in_count: parseInt(bookingCounts[0].walk_in_count || 0),
        online_booking_count: parseInt(bookingCounts[0].online_booking_count || 0),
        total_bookings: parseInt(bookingCounts[0].total_bookings || 0),
        pending_registrations: parseInt(pendingUsers[0].pending_count || 0),
        total_clients: parseInt(userCounts[0].total_clients || 0),
        total_cashiers: parseInt(userCounts[0].total_cashiers || 0),
        total_revenue: parseFloat(revenue[0].total_revenue || 0),
        total_services: parseInt(servicesCount[0].total_services || 0)
      }
    });
  } catch (error) {
    console.error('Get Dashboard Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating report overview', error: error.message });
  }
};

// @desc    Get detailed sales report (Admin only)
// @route   GET /api/reports/sales
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT i.invoice_number, i.total_amount, i.status, p.payment_method, p.paid_at,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name,
             s.name AS service_name, sc.name AS category_name
      FROM invoices i
      JOIN payments p ON p.invoice_id = i.id
      JOIN users u ON i.client_id = u.id
      JOIN bookings b ON i.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      JOIN service_categories sc ON s.category_id = sc.id
      WHERE i.status = 'PAID'
    `;
    const params = [];

    if (startDate) {
      query += ` AND p.paid_at >= ?`;
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      query += ` AND p.paid_at <= ?`;
      params.push(`${endDate} 23:59:59`);
    }

    query += ` ORDER BY p.paid_at DESC`;

    const [sales] = await pool.query(query, params);

    const totalSalesSum = sales.reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

    return res.json({
      success: true,
      count: sales.length,
      total_sales_amount: totalSalesSum,
      data: sales
    });
  } catch (error) {
    console.error('Get Sales Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating sales report', error: error.message });
  }
};

module.exports = { getDashboardOverview, getSalesReport };
