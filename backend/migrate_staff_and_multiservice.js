const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

    console.log('[Migration] Connected to database:', process.env.DB_NAME);

    // 1. Insert Staff Roles if they do not exist
    const staffRoles = [
      { name: 'NAIL_TECHNICIAN', description: 'Nail Technician (Manicure, Pedicure, Nail Art)' },
      { name: 'BEAUTICIAN',       description: 'Beautician (Hair styling, treatments, aesthetics)' },
      { name: 'THERAPIST',        description: 'Massage Therapist (Body treatments & spa)' }
    ];

    for (const r of staffRoles) {
      const [existing] = await conn.query('SELECT id FROM roles WHERE name = ?', [r.name]);
      if (existing.length === 0) {
        await conn.query('INSERT INTO roles (name, description) VALUES (?, ?)', [r.name, r.description]);
        console.log(`✓ Added role: ${r.name}`);
      } else {
        console.log(`~ Role already exists: ${r.name}`);
      }
    }

    // 2. Add staff_id column to bookings table
    try {
      await conn.query(`
        ALTER TABLE bookings
        ADD COLUMN staff_id INT NULL AFTER service_id
      `);
      console.log('✓ Added staff_id column to bookings table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ staff_id column already exists in bookings');
      } else {
        console.error('! Error adding staff_id column:', e.message);
      }
    }

    // Add foreign key constraint for staff_id if not present
    try {
      await conn.query(`
        ALTER TABLE bookings
        ADD CONSTRAINT fk_bookings_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Added fk_bookings_staff foreign key to bookings table');
    } catch (e) {
      if (e.code === 'ER_DUP_KEY' || e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.message.includes('already exists')) {
        console.log('~ fk_bookings_staff foreign key already exists');
      } else {
        console.log('~ fk_bookings_staff notice:', e.message);
      }
    }

    // 3. Allow booking_id in invoices to be NULL (for multi-booking invoices)
    try {
      await conn.query(`ALTER TABLE invoices MODIFY booking_id INT NULL`);
      console.log('✓ Modified invoices.booking_id to allow NULL');
    } catch (e) {
      console.log('~ invoices.booking_id alter note:', e.message);
    }

    // 4. Create invoice_items table for continuous / multi-service billing
    await conn.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        booking_id INT NULL,
        service_id INT NOT NULL,
        staff_id INT NULL,
        service_name VARCHAR(100) NOT NULL,
        staff_name VARCHAR(100) NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_inv_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_inv_items_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_inv_items_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_inv_items_staff FOREIGN KEY (staff_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ invoice_items table is ready');

    // 5. Backfill existing invoices into invoice_items if empty
    const [existingItems] = await conn.query('SELECT COUNT(*) as count FROM invoice_items');
    if (existingItems[0].count === 0) {
      const [oldInvoices] = await conn.query(`
        SELECT i.id as invoice_id, i.booking_id, b.service_id, s.name as service_name, s.price, b.staff_id
        FROM invoices i
        JOIN bookings b ON i.booking_id = b.id
        JOIN services s ON b.service_id = s.id
      `);

      for (const row of oldInvoices) {
        await conn.query(`
          INSERT INTO invoice_items (invoice_id, booking_id, service_id, staff_id, service_name, price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [row.invoice_id, row.booking_id, row.service_id, row.staff_id, row.service_name, row.price]);
      }
      console.log(`✓ Backfilled ${oldInvoices.length} existing invoice items`);
    } else {
      console.log(`~ invoice_items already contains ${existingItems[0].count} records`);
    }

    // 6. Seed / ensure Hazel, Lhurence, Michael exist with unique Staff IDs
    const defaultPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // Get role IDs
    const [roleRows] = await conn.query('SELECT id, name FROM roles');
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.name] = r.id; });

    const staffSeed = [
      {
        first_name: 'Hazel',
        last_name: 'Nail Specialist',
        email: 'hazel@sas.com',
        phone: '09170000001',
        gender: 'FEMALE',
        role_name: 'NAIL_TECHNICIAN',
        role_id: roleMap['NAIL_TECHNICIAN'],
        preferred_num: 'STF-2026-0004'
      },
      {
        first_name: 'Lhurence',
        last_name: 'Beautician',
        email: 'lhurence@sas.com',
        phone: '09170000002',
        gender: 'MALE',
        role_name: 'BEAUTICIAN',
        role_id: roleMap['BEAUTICIAN'],
        preferred_num: 'STF-2026-0005'
      },
      {
        first_name: 'Michael',
        last_name: 'Therapist',
        email: 'michael@sas.com',
        phone: '09170000003',
        gender: 'MALE',
        role_name: 'THERAPIST',
        role_id: roleMap['THERAPIST'],
        preferred_num: 'STF-2026-0006'
      }
    ];

    for (const stf of staffSeed) {
      const [u] = await conn.query('SELECT id, client_number FROM users WHERE email = ?', [stf.email]);
      if (u.length === 0) {
        // Check if preferred_num exists
        let client_number = stf.preferred_num;
        const [numChk] = await conn.query('SELECT id FROM users WHERE client_number = ?', [client_number]);
        if (numChk.length > 0) {
          // generate alternative
          const [maxNum] = await conn.query(`SELECT client_number FROM users WHERE client_number LIKE 'STF-2026-%' ORDER BY client_number DESC LIMIT 1`);
          const seq = parseInt(maxNum[0]?.client_number?.split('-')[2] || '6', 10) + 1;
          client_number = `STF-2026-${String(seq).padStart(4, '0')}`;
        }

        const [ins] = await conn.query(`
          INSERT INTO users (role_id, client_number, first_name, last_name, email, phone, gender, password_hash, plain_password, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
        `, [stf.role_id, client_number, stf.first_name, stf.last_name, stf.email, stf.phone, stf.gender, passwordHash, defaultPassword]);

        console.log(`✓ Seeded Staff: ${stf.first_name} (${stf.role_name}) -> ID ${ins.insertId}, Staff # ${client_number}`);
      } else {
        // Ensure role_id is up to date
        await conn.query('UPDATE users SET role_id = ?, status = ? WHERE id = ?', [stf.role_id, 'APPROVED', u[0].id]);
        console.log(`~ Staff already exists: ${stf.first_name} -> Staff # ${u[0].client_number}`);
      }
    }

    console.log('\n[Migration Complete] All tables and staff records are ready.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
