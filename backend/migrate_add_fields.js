const mysql = require('mysql2/promise');

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'sas_db',
      password: 'sas_db',
      database: 'sas_db'
    });

    console.log('Connected to database...');

    // Add gender column
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN gender ENUM('MALE','FEMALE','OTHER') DEFAULT NULL AFTER phone"
      );
      console.log('✓ gender column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ gender column already exists, skipping');
      } else {
        throw e;
      }
    }

    // Add home_address column
    try {
      await conn.execute(
        "ALTER TABLE users ADD COLUMN home_address TEXT DEFAULT NULL AFTER gender"
      );
      console.log('✓ home_address column added successfully');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('~ home_address column already exists, skipping');
      } else {
        throw e;
      }
    }

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
