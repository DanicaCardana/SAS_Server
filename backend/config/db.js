const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'sas_db',
  password: process.env.DB_PASSWORD || 'sas_db',
  database: process.env.DB_NAME || 'sas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Test connection on launch
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${process.env.DB_NAME || 'sas_db'}`);
    connection.release();
  } catch (err) {
    console.error(`[Database Error] Connection failed:`, err.message);
  }
}

testConnection();

module.exports = pool;
