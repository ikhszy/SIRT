// server/routes/residentDetails.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const dbPath = path.resolve(__dirname, "../db/community.sqlite");

// Get all resident details with basic resident info
router.get("/", authMiddleware, (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const sql = `
    SELECT d.*, r.name AS resident_name
    FROM resident_details d
    LEFT JOIN residents r ON d.resident_id = r.id
  `;
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add resident details
router.post("/", authMiddleware, (req, res) => {
  const {
    resident_id,
    education,
    occupation,
    blood_type,
    domicile_status,
    father_name,
    mother_name,
    remarks
  } = req.body;

  const db = new sqlite3.Database(dbPath);
  const stmt = `
    INSERT INTO resident_details (
      resident_id, education, occupation, blood_type,
      domicile_status, father_name, mother_name, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(
    stmt,
    [resident_id, education, occupation, blood_type, domicile_status, father_name, mother_name, remarks],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

module.exports = router;