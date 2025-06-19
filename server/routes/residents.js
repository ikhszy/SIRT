const express = require("express");
const router = express.Router();
const db = require('../db/db.js');
const authMiddleware = require('../middleware/authMiddleware');

// GET all residents with server-side filtering
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.query.lookup === 'true') {
      const sql = `SELECT nik, full_name FROM residents ORDER BY full_name ASC`;
      const rows = await db.all(sql);
      return res.json(rows);
    }

    const {
      full_name = '', nik = '', kk_number = '', gender = '', birthplace = '',
      education = '', occupation = '', full_address = '', status = ''
    } = req.query;

    const filters = [];
    const params = [];

    if (full_name) {
      filters.push(`r.full_name LIKE ?`);
      params.push(`%${full_name}%`);
    }
    if (nik) {
      filters.push(`r.nik LIKE ?`);
      params.push(`%${nik}%`);
    }
    if (kk_number) {
      filters.push(`r.kk_number LIKE ?`);
      params.push(`%${kk_number}%`);
    }
    if (gender) {
      filters.push(`r.gender LIKE ?`);
      params.push(`%${gender}%`);
    }
    if (birthplace) {
      filters.push(`r.birthplace LIKE ?`);
      params.push(`%${birthplace}%`);
    }
    if (education) {
      filters.push(`r.education LIKE ?`);
      params.push(`%${education}%`);
    }
    if (occupation) {
      filters.push(`r.occupation LIKE ?`);
      params.push(`%${occupation}%`);
    }
    if (status) {
      filters.push(`r.status = ?`);
      params.push(status);
    }
    if (full_address) {
      filters.push(`a.full_address LIKE ?`);
      params.push(`%${full_address}%`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const sql = `
      SELECT r.*, a.full_address
      FROM residents r
      LEFT JOIN address a ON r.address_id = a.id
      LEFT JOIN households h ON r.kk_number = h.kk_number
      ${whereClause}
    `;

    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET residents with filters failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET resident by NIK
router.get("/nik/:nik", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT r.*, a.full_address, h.kk_number
      FROM residents r
      LEFT JOIN address a ON r.address_id = a.id
      LEFT JOIN households h ON r.kk_number = h.kk_number
      WHERE r.nik = ?
    `;
    const row = await db.get(sql, [req.params.nik]);
    if (!row) return res.status(404).json({ error: 'Resident not found' });
    res.json(row);
  } catch (err) {
    console.error('GET resident by NIK failed:', err);
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
      education, occupation, citizenship, status, address_id,
      status_remarks // 🆕
    } = req.body;

    const sql = `
      INSERT INTO residents (
        full_name, nik, kk_number, gender, birthplace, birthdate,
        age, blood_type, religion, marital_status, relationship,
        education, occupation, citizenship, status, address_id,
        status_remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(sql, [
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id,
      status_remarks // 🆕
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
      education, occupation, citizenship, status, address_id,
      status_remarks // 🆕
    } = req.body;

    const sql = `
      UPDATE residents SET
        full_name = ?, nik = ?, kk_number = ?, gender = ?, birthplace = ?, birthdate = ?,
        age = ?, blood_type = ?, religion = ?, marital_status = ?, relationship = ?, education = ?,
        occupation = ?, citizenship = ?, status = ?, address_id = ?, status_remarks = ?
      WHERE id = ?
    `;

    const result = await db.run(sql, [
      full_name, nik, kk_number, gender, birthplace, birthdate,
      age, blood_type, religion, marital_status, relationship,
      education, occupation, citizenship, status, address_id,
      status_remarks, // 🆕
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
