const express = require("express");
const router = express.Router();
const db = require('../db/db.js');
const authMiddleware = require('../middleware/authMiddleware');

// GET all residents
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT r.*, a.full_address
      FROM residents r
      LEFT JOIN address a ON r.address_id = a.id
      LEFT JOIN households h ON r.kk_number = h.kk_number
    `;
    const rows = await db.all(sql);
    res.json(rows);
  } catch (err) {
    console.error('GET residents failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET resident by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT r.*, a.full_address
      FROM residents r
      LEFT JOIN address a ON r.address_id = a.id
      WHERE r.id = ?
    `;
    const row = await db.get(sql, [req.params.id]);
    res.json(row);
  } catch (err) {
    console.error('GET resident failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create resident
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id
    } = req.body;

    const sql = `
      INSERT INTO residents (
        full_name, nik, kk_number, gender, birthplace, birthdate,
        age, blood_type, religion, marital_status, relationship,
        education, occupation, citizenship, status, address_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(sql, [
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id
    ]);

    res.json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('Create resident failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update resident
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const {
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id
    } = req.body;

    const sql = `
      UPDATE residents SET
        full_name = ?, nik = ?, kk_number = ?, gender = ?, birthplace = ?, birthdate = ?,
        age = ?, blood_type = ?, religion = ?, marital_status = ?, relationship = ?, education = ?,
        occupation = ?, citizenship = ?, status = ?, address_id = ?
      WHERE id = ?
    `;

    const result = await db.run(sql, [
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id,
      req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.json({ success: true, message: 'Resident updated successfully' });
  } catch (err) {
    console.error('Update resident failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE resident
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const sql = `DELETE FROM residents WHERE id = ?`;
    const result = await db.run(sql, [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Delete resident failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
