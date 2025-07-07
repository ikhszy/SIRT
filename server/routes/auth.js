const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');

const JWT_SECRET = 'your_jwt_secret'; // same as middleware
const dbPath = path.join(__dirname, '../db/community.sqlite');
const db = new sqlite3.Database(dbPath);

// 👇 Cleanup function
function cleanOldDonationHistory() {
  const cutoff = dayjs().subtract(24, 'month').format('MM-YYYY');
  const sql = `DELETE FROM donation_history WHERE month < ?`;

  db.run(sql, [cutoff], function (err) {
    if (err) {
      console.error('[🧹 Cleanup Error]', err.message);
    } else if (this.changes > 0) {
      console.log(`[🧹 Cleanup] Deleted ${this.changes} records older than ${cutoff}`);
    }
  });
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user) => {
    if (err) {
      console.error('DB error during login:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error verifying password' });
      }

      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.userId, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 🧹 Trigger donation cleanup (async, non-blocking)
      cleanOldDonationHistory();

      return res.json({ success: true, token });
    });
  });
});

module.exports = router;
