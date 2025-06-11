const express = require('express');
const router = express.Router();
const path = require("path");
const sqlite3 = require("sqlite3");
const DB_PATH = path.join(__dirname, "../db/community.sqlite");
const db = new sqlite3.Database(DB_PATH);

router.get('/resident-summary', async (req, res) => {
  try {
    const totalResidents = await db.get(`SELECT COUNT(*) as count FROM residents`);
    const totalHouseholds = await db.get(`SELECT COUNT(DISTINCT kk_number) as count FROM households`);
    const totalAddresses = await db.get(`SELECT COUNT(*) as count FROM address`);

    const ageStats = await db.all(`
      SELECT 
        CASE
          WHEN age < 18 THEN 'Children'
          WHEN age BETWEEN 18 AND 59 THEN 'Adults'
          ELSE 'Elderly'
        END as group_name,
        COUNT(*) as count
      FROM (
        SELECT 
          (strftime('%Y', 'now') - strftime('%Y', birthdate)) -
          (strftime('%m-%d', 'now') < strftime('%m-%d', birthdate)) as age
        FROM residents
      )
      GROUP BY group_name
    `);

    const bloodTypes = await db.all(`
      SELECT blood_type, COUNT(*) as count
      FROM residents
      WHERE blood_type IS NOT NULL
      GROUP BY blood_type
    `);

    res.json({
      totalResidents: totalResidents.count,
      totalHouseholds: totalHouseholds.count,
      totalAddresses: totalAddresses.count,
      ageGroups: ageStats,
      bloodTypes: bloodTypes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get resident summary' });
  }
});

module.exports = router;
