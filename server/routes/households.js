const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db/db.js');

// GET all households with address info
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT h.*, a.full_address
      FROM households h
      LEFT JOIN address a ON h.address_id = a.id
    `;
    const rows = await db.all(sql);
    res.json(rows);
  } catch (err) {
    console.error("GET all households failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET a single household by KK number
router.get("/:kk_number", authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT h.*, a.full_address
      FROM households h
      LEFT JOIN address a ON h.address_id = a.id
      WHERE h.kk_number = ?
    `;
    const row = await db.get(sql, [req.params.kk_number]);
    if (!row) return res.status(404).json({ error: "Household not found" });
    res.json(row);
  } catch (err) {
    console.error("GET household failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new household
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      kk_number,
      address_id,
      status_KK,
      status_KK_remarks,
      status_kepemilikan_rumah,
      borrowed_from_kk,
      kepemilikan_remarks
    } = req.body;

    if (status_kepemilikan_rumah === "numpang alamat" && !borrowed_from_kk) {
      return res.status(400).json({ error: "borrowed_from_kk is required when status_kepemilikan_rumah is 'numpang alamat'" });
    }

    // Check if KK number already exists
    const existing = await db.get(`SELECT kk_number FROM households WHERE kk_number = ?`, [kk_number]);
    if (existing) {
      return res.status(400).json({ error: "Nomor KK sudah digunakan. Harap periksa kembali." });
    }

    const sql = `
      INSERT INTO households (
        kk_number, address_id, status_KK, status_KK_remarks,
        status_kepemilikan_rumah, borrowed_from_kk, kepemilikan_remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.run(sql, [
      kk_number,
      address_id,
      status_KK,
      status_KK === "tidak aktif" ? status_KK_remarks || "" : null,
      status_kepemilikan_rumah,
      borrowed_from_kk || null,
      status_kepemilikan_rumah !== "pemilik" ? kepemilikan_remarks || "" : null
    ]);

    // Auto-update resident statuses
    if (status_KK === "tidak aktif") {
      await db.run(
        `UPDATE residents SET status = 'tidak aktif - lainnya', status_remarks = ? WHERE kk_number = ?`,
        [status_KK_remarks || 'KK tidak aktif', kk_number]
      );
    } else if (status_kepemilikan_rumah === "pemilik belum pindah") {
      await db.run(
        `UPDATE residents SET status = 'tidak aktif - domisili diluar', status_remarks = 'Pemilik belum pindah alamat' WHERE kk_number = ?`,
        [kk_number]
      );
    }

    res.status(201).json({ message: "Household created" });
  } catch (err) {
    console.error("CREATE household failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE household by KK number
router.put("/:kk_number", authMiddleware, async (req, res) => {
  try {
    const {
      address_id,
      status_KK,
      status_KK_remarks,
      status_kepemilikan_rumah,
      borrowed_from_kk,
      kepemilikan_remarks
    } = req.body;

    if (status_kepemilikan_rumah === "numpang alamat" && !borrowed_from_kk) {
      return res.status(400).json({ error: "borrowed_from_kk is required when status_kepemilikan_rumah is 'numpang alamat'" });
    }

    const sql = `
      UPDATE households
      SET
        address_id = ?,
        status_KK = ?,
        status_KK_remarks = ?,
        status_kepemilikan_rumah = ?,
        borrowed_from_kk = ?,
        kepemilikan_remarks = ?
      WHERE kk_number = ?
    `;

    const result = await db.run(sql, [
      address_id,
      status_KK,
      status_KK === "tidak aktif" ? status_KK_remarks || "" : null,
      status_kepemilikan_rumah,
      borrowed_from_kk || null,
      status_kepemilikan_rumah !== "pemilik" ? kepemilikan_remarks || "" : null,
      req.params.kk_number
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Auto-update resident statuses
    if (status_KK === "tidak aktif") {
      await db.run(
        `UPDATE residents SET status = 'tidak aktif - lainnya', status_remarks = ? WHERE kk_number = ?`,
        [status_KK_remarks || 'KK tidak aktif', req.params.kk_number]
      );
    } else if (status_kepemilikan_rumah === "pemilik belum pindah") {
      await db.run(
        `UPDATE residents SET status = 'tidak aktif - domisili diluar', status_remarks = 'Pemilik belum pindah alamat' WHERE kk_number = ?`,
        [req.params.kk_number]
      );
    }

    res.json({ message: "Household updated" });
  } catch (err) {
    console.error("UPDATE household failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE household by KK number
router.delete("/:kk_number", authMiddleware, async (req, res) => {
  try {
    const sql = `DELETE FROM households WHERE kk_number = ?`;
    const result = await db.run(sql, [req.params.kk_number]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Household not found" });
    }

    res.status(204).end();
  } catch (err) {
    console.error("DELETE household failed:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
