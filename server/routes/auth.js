const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const JWT_SECRET = 'your_jwt_secret'; // same as middleware
const dbPath = path.join(__dirname, '../db/community.sqlite');
const db = new sqlite3.Database(dbPath);

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
      if (err) return res.status(500).json({ success: false, message: 'Error verifying password' });

      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.userId, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      res.json({ success: true, token });
    });
  });
});

module.exports = router;
