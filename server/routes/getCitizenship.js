const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db/db.js'); // Adjust path if needed

// Example Express.js route to get distinct citizenships
app.get('/residents/citizenships', (req, res) => {
  db.all('SELECT DISTINCT citizenship FROM residents', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const citizenships = rows.map(r => r.citizenship).filter(Boolean);
    res.json(citizenships);
  });
});

module.exports = router;
