const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'sas_db',
      password: process.env.DB_PASSWORD || 'sas_db',
      database: process.env.DB_NAME || 'sas_db'
    });

    console.log('Connected to MySQL database...');

    // 1. Add client_number column to users table
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN client_number VARCHAR(30) DEFAULT NULL AFTER role_id"
      );
      console.log('✓ client_number column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ client_number column already exists, skipping ADD COLUMN');
      } else {
        console.error('! client_number column error:', e.message);
      }
    }

    // 2. Add UNIQUE index on client_number
    try {
      await conn.execute(
        "ALTER TABLE users ADD UNIQUE KEY idx_users_client_number (client_number)"
      );
      console.log('✓ idx_users_client_number unique key added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('~ idx_users_client_number index already exists, skipping');
      } else {
        console.error('! index error:', e.message);
      }
    }

    // 3. Backfill Staff accounts (ADMIN & CASHIER)
    const [staffRows] = await conn.query(`
      SELECT u.id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('ADMIN', 'CASHIER') AND (u.client_number IS NULL OR u.client_number = '')
      ORDER BY u.id ASC
    `);

    for (let i = 0; i < staffRows.length; i++) {
      const u = staffRows[i];
      const num = `STF-2026-${String(u.id).padStart(4, '0')}`;
      await conn.query('UPDATE users SET client_number = ? WHERE id = ?', [num, u.id]);
      console.log(`✓ Backfilled Staff ID ${u.id} (${u.role_name}) -> ${num}`);
    }

    // 4. Backfill Client accounts (CLIENT)
    const [clientRows] = await conn.query(`
      SELECT u.id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'CLIENT' AND (u.client_number IS NULL OR u.client_number = '')
      ORDER BY u.id ASC
    `);

    for (let i = 0; i < clientRows.length; i++) {
      const u = clientRows[i];
      const num = `CLI-2026-${String(u.id).padStart(4, '0')}`;
      await conn.query('UPDATE users SET client_number = ? WHERE id = ?', [num, u.id]);
      console.log(`✓ Backfilled Client ID ${u.id} -> ${num}`);
    }

    console.log('\nMigration and backfill completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
