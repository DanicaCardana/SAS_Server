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

    // 1. Add middle_name column
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN middle_name VARCHAR(50) DEFAULT NULL AFTER last_name"
      );
      console.log('✓ middle_name column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ middle_name column already exists, skipping');
      } else {
        console.error('! middle_name error:', e.message);
      }
    }

    // 2. Add gender column (if not exists)
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN gender ENUM('MALE','FEMALE','OTHER') DEFAULT NULL AFTER phone"
      );
      console.log('✓ gender column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ gender column already exists, skipping');
      } else {
        console.error('! gender error:', e.message);
      }
    }

    // 3. Add civil_status column
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN civil_status ENUM('SINGLE','MARRIED','WIDOWED','SEPARATED','OTHER') DEFAULT NULL AFTER gender"
      );
      console.log('✓ civil_status column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ civil_status column already exists, skipping');
      } else {
        console.error('! civil_status error:', e.message);
      }
    }

    // 4. Add birthdate column
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN birthdate DATE DEFAULT NULL AFTER civil_status"
      );
      console.log('✓ birthdate column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ birthdate column already exists, skipping');
      } else {
        console.error('! birthdate error:', e.message);
      }
    }

    // 5. Add home_address column (if not exists)
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN home_address TEXT DEFAULT NULL AFTER birthdate"
      );
      console.log('✓ home_address column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ home_address column already exists, skipping');
      } else {
        console.error('! home_address error:', e.message);
      }
    }

    // 6. Ensure password_hash allows NULL
    try {
      await conn.execute(
        "ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) DEFAULT NULL"
      );
      console.log('✓ password_hash column modified to allow NULL');
    } catch (e) {
      console.error('! password_hash modify error:', e.message);
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration connection failed:', err.message);
  } finally {
    if (conn) await conn.end();
  }
})();
