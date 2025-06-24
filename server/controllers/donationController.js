const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbPath = path.resolve(__dirname, "../db/community.sqlite");
// Helper: open DB
const getDb = () => new sqlite3.Database(dbPath);
const dayjs = require('dayjs'); // add dayjs to your project if not present

// Add new donation entries (possibly multiple months)
const createDonation = async (req, res) => {
  const db = getDb();
  const { address_id, months, amount_per_month, date_paid } = req.body;

  if (!address_id || !Array.isArray(months) || months.length === 0 || !amount_per_month || !date_paid) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const insertStmt = db.prepare(`
      INSERT INTO donation_history (address_id, month, amount, date_paid)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction(() => {
      months.forEach(month => {
        insertStmt.run(address_id, month, amount_per_month, date_paid);
      });
    });

    insertMany();
    res.status(201).json({ message: 'Donations recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record donation' });
  }
};

// Get all donation history for a specific address
const getDonationHistoryByAddress = async (req, res) => {
  const db = getDb();
  const { addressId } = req.params;

  try {
    const rows = db.prepare(`
      SELECT * FROM donation_history
      WHERE address_id = ?
      ORDER BY month ASC
    `).all(addressId);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve donation history' });
  }
};

// Get monthly totals for finance report
const getDonationReport = async (req, res) => {
  console.log('addressId:', addressId, 'year:', year);

  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT strftime('%Y-%m', date_paid) AS report_month, SUM(amount) AS total
      FROM donation_history
      GROUP BY report_month
      ORDER BY report_month DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

const getDonationStatusByAddressYear = (req, res) => {
  const { addressId } = req.params;
  const year = req.query.year;

  console.log('DEBUG params:', req.params);
  console.log('DEBUG query:', req.query);


  const db = getDb();
  const dayjs = require('dayjs');

  if (!addressId || !year) {
    return res.status(400).json({ message: 'Missing addressId or year' });
  }

  const addressIdInt = parseInt(addressId); // force as number

  const sql = `
    SELECT TRIM(month) AS month FROM donation_history
    WHERE address_id = ?
    AND TRIM(month) LIKE ?
  `;

  db.all(sql, [addressIdInt, `${year}-%`], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to get donation status' });
    }

    const paidRows = Array.isArray(rows) ? rows : [];
    console.log('paidRows:', paidRows);

    const paidMonthsSet = new Set(
      paidRows.map(row => row.month.trim()) // make extra sure
    );
    console.log('paidMonthsSet:', paidMonthsSet);

    const results = [];
    const now = dayjs();

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      if (paidMonthsSet.has(monthStr)) {
        results.push({ month: monthStr, status: 'paid' });
      } else {
        const dueDate = dayjs(`${monthStr}-01`).endOf('month');
        const status = now.isAfter(dueDate) ? 'late' : 'pending';
        results.push({ month: monthStr, status });
      }
    }

    res.json(results);
  });
};

module.exports = {
  createDonation,
  getDonationHistoryByAddress,
  getDonationReport,
  getDonationStatusByAddressYear,
};
