const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const dbPath = path.resolve(__dirname, "../db/community.sqlite");

// GET all addresses
router.get("/", authMiddleware, (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all("SELECT * FROM address", [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:id", authMiddleware, (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.get("SELECT * FROM address WHERE id = ?", [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Address not found" });
    res.json(row);
  });
});

// CREATE address
router.post("/", authMiddleware, (req, res) => {
  const { full_address, rt, rw, village, district, city, postal_code } = req.body;
  const db = new sqlite3.Database(dbPath);
  db.run(
    `INSERT INTO address (full_address, rt, rw, village, district, city, postal_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [full_address, rt, rw, village, district, city, postal_code],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Update address
router.put("/:id", authMiddleware, (req, res) => {
  const { full_address, rt, rw, village, district, city, postal_code } = req.body;
  const db = new sqlite3.Database(dbPath);
  db.run(
    `UPDATE address set full_address = ?, rt = ?, rw = ?, village = ?, district = ?, city = ?, postal_code = ? where id = ?`,
    [full_address, rt, rw, village, district, city, postal_code],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.delete("/:id", authMiddleware, (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const sql = `DELETE FROM address WHERE id = ?`;
  db.run(sql, [req.params.id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(204).end();
  });
});

module.exports = router;

