const db = require('../db/db');

// Add new donation entries (possibly multiple months)
const createDonation = async (req, res) => {
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

module.exports = {
  createDonation,
  getDonationHistoryByAddress,
  getDonationReport,
};
