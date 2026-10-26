const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import API Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

const pool = require('./config/db');

// Base Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Salon and Spa Management System API',
    status: 'ONLINE',
    documentation: '/api/health'
  });
});

app.get('/api/health', async (req, res) => {
  let dbStatus = 'UNKNOWN';
  let dbError = null;
  try {
    const conn = await pool.getConnection();
    dbStatus = 'CONNECTED';
    conn.release();
  } catch (err) {
    dbStatus = 'FAILED';
    dbError = err.message;
  }

  res.json({
    status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
    database: {
      status: dbStatus,
      error: dbError,
      host: process.env.DB_HOST || 'localhost (default)',
      database: process.env.DB_NAME || 'sas_db (default)',
      ssl: process.env.DB_SSL === 'true'
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Global Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`[SAS Backend Server] Listening on http://localhost:${PORT}`);
  console.log(`[API Base Route] http://localhost:${PORT}/api`);
  console.log(`===================================================`);
});
