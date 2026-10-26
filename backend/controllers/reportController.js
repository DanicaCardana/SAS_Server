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

    // 6. Recent 7-day revenue trend for simple dashboard graph
    const [recentTrend] = await pool.query(
      `SELECT DATE_FORMAT(p.paid_at, '%Y-%m-%d') AS date,
              DATE_FORMAT(p.paid_at, '%a') AS day_name,
              COALESCE(SUM(i.total_amount), 0) AS revenue,
              COUNT(p.id) AS transactions
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE i.status = 'PAID' AND p.paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(p.paid_at, '%Y-%m-%d'), DATE_FORMAT(p.paid_at, '%a')
       ORDER BY date ASC`
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
        total_services: parseInt(servicesCount[0].total_services || 0),
        recent_trend: recentTrend.map(r => ({
          date: r.date,
          day: r.day_name,
          revenue: parseFloat(r.revenue || 0),
          transactions: parseInt(r.transactions || 0)
        }))
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
    let { startDate, endDate, period } = req.query;

    // Helper to format Date object into YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();

    // Auto calculate dates if period is set and dates are omitted
    if (period === 'weekly' && (!startDate || !endDate)) {
      const day = now.getDay();
      const diffToMon = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = startDate || formatDate(monday);
      endDate = endDate || formatDate(sunday);
    } else if (period === 'monthly' && (!startDate || !endDate)) {
      const y = now.getFullYear();
      const m = now.getMonth();
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      startDate = startDate || formatDate(firstDay);
      endDate = endDate || formatDate(lastDay);
    } else if (period === 'yearly' && (!startDate || !endDate)) {
      const y = now.getFullYear();
      startDate = startDate || `${y}-01-01`;
      endDate = endDate || `${y}-12-31`;
    }

    let query = `
      SELECT i.invoice_number, i.total_amount, i.status, p.payment_method, p.paid_at,
             CONCAT(u.first_name, ' ', u.last_name) AS client_name, u.client_number,
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

    const totalSalesSum = sales.reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);

    // Grouping by Category
    const categoryMap = {};
    // Grouping by Payment Method
    const methodMap = {};
    // Grouping by Date for timeline
    const timelineMap = {};

    sales.forEach(row => {
      const amt = parseFloat(row.total_amount || 0);

      // Category
      const cat = row.category_name || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, total: 0, count: 0 };
      categoryMap[cat].total += amt;
      categoryMap[cat].count += 1;

      // Method
      const method = row.payment_method || 'CASH';
      if (!methodMap[method]) methodMap[method] = { method, total: 0, count: 0 };
      methodMap[method].total += amt;
      methodMap[method].count += 1;

      // Timeline Date (YYYY-MM-DD)
      const paidDate = row.paid_at ? new Date(row.paid_at) : null;
      if (paidDate && !isNaN(paidDate)) {
        const dateKey = formatDate(paidDate);
        if (!timelineMap[dateKey]) {
          timelineMap[dateKey] = {
            date: dateKey,
            revenue: 0,
            count: 0
          };
        }
        timelineMap[dateKey].revenue += amt;
        timelineMap[dateKey].count += 1;
      }
    });

    const categoryBreakdown = Object.values(categoryMap).map(c => ({
      ...c,
      percentage: totalSalesSum > 0 ? Math.round((c.total / totalSalesSum) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    const methodBreakdown = Object.values(methodMap).map(m => ({
      ...m,
      percentage: totalSalesSum > 0 ? Math.round((m.total / totalSalesSum) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    const timelineData = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      count: sales.length,
      total_sales_amount: totalSalesSum,
      period: period || 'custom',
      startDate: startDate || null,
      endDate: endDate || null,
      summary: {
        total_revenue: totalSalesSum,
        transaction_count: sales.length,
        average_order_value: sales.length > 0 ? (totalSalesSum / sales.length) : 0
      },
      by_category: categoryBreakdown,
      by_payment_method: methodBreakdown,
      timeline: timelineData,
      data: sales
    });
  } catch (error) {
    console.error('Get Sales Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error generating sales report', error: error.message });
  }
};

// @desc    Get public-facing stats for the landing page (no auth)
// @route   GET /api/reports/public-stats
const getPublicStats = async (req, res) => {
  try {
    // Approved clients count
    const [clientRows] = await pool.query(
      `SELECT COUNT(*) AS total_clients
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'CLIENT' AND u.status = 'APPROVED'`
    );

    // Staff count (admins + cashiers)
    const [staffRows] = await pool.query(
      `SELECT COUNT(*) AS total_staff
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('ADMIN', 'CASHIER') AND u.status = 'APPROVED'`
    );

    // Completed / served bookings
    const [bookingRows] = await pool.query(
      `SELECT COUNT(*) AS total_served FROM bookings WHERE status = 'COMPLETED'`
    );

    // Founding year stored as an env variable, fallback to 2020
    const foundedYear = parseInt(process.env.FOUNDED_YEAR || '2020', 10);
    const yearsInBusiness = new Date().getFullYear() - foundedYear;

    return res.json({
      success: true,
      data: {
        total_clients:      parseInt(clientRows[0].total_clients || 0),
        total_staff:        parseInt(staffRows[0].total_staff   || 0),
        total_served:       parseInt(bookingRows[0].total_served || 0),
        years_in_business:  yearsInBusiness > 0 ? yearsInBusiness : 1,
      }
    });
  } catch (error) {
    console.error('Get Public Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching public stats', error: error.message });
  }
};

module.exports = { getDashboardOverview, getSalesReport, getPublicStats };
