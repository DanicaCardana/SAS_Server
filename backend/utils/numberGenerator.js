/**
 * Generates a unique client or staff number based on user role and year.
 * Examples:
 * - Clients: CLI-2026-0014
 * - Staff (Admin / Cashier): STF-2026-0003
 */
const generateUserNumber = async (pool, roleName) => {
  const isStaff = ['ADMIN', 'CASHIER', 'NAIL_TECHNICIAN', 'BEAUTICIAN', 'THERAPIST'].includes((roleName || '').toUpperCase());
  const prefix = isStaff ? 'STF' : 'CLI';
  const year = new Date().getFullYear();
  const searchPattern = `${prefix}-${year}-%`;

  // Find the highest sequence number for this prefix and year
  const [rows] = await pool.query(
    `SELECT client_number 
     FROM users 
     WHERE client_number LIKE ? 
     ORDER BY client_number DESC 
     LIMIT 10`,
    [searchPattern]
  );

  let maxSeq = 0;
  for (const row of rows) {
    if (row.client_number) {
      const parts = row.client_number.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  // Next sequence number
  const nextSeq = maxSeq + 1;
  const candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

  // Double check uniqueness
  const [existing] = await pool.query('SELECT id FROM users WHERE client_number = ?', [candidate]);
  if (existing.length === 0) {
    return candidate;
  }

  // Fallback in case of race condition or collision
  let counter = nextSeq + 1;
  while (true) {
    const fallback = `${prefix}-${year}-${String(counter).padStart(4, '0')}`;
    const [chk] = await pool.query('SELECT id FROM users WHERE client_number = ?', [fallback]);
    if (chk.length === 0) {
      return fallback;
    }
    counter++;
  }
};

module.exports = { generateUserNumber };
