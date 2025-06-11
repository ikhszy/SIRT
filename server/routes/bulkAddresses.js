const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const upload = multer({ dest: "uploads/" });
const dbPath = path.join(__dirname, "../db/community.sqlite");

// POST /api/address-import/preview
router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    fs.unlink(req.file.path, () => {}); // Delete uploaded file after reading

    res.json({ success: true, data: rows });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: "Failed to parse Excel file." });
  }
});

// POST /api/address-import/bulk
router.post("/bulk", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const db = new sqlite3.Database(dbPath);
    const inserted = [];
    const errors = [];

    // Process each row asynchronously with Promises
    const tasks = rows.map((row, index) => {
      return new Promise((resolve) => {
        const full_address = (row["Alamat Lengkap"] || "").toString().trim();
        const rt = (row["RT"] || "").toString().trim();
        const rw = (row["RW"] || "").toString().trim();
        const village = (row["Kelurahan"] || "").toString().trim();
        const district = (row["Kecamatan"] || "").toString().trim();
        const city = (row["Kota"] || "").toString().trim();
        const postal_code = (row["Kodepos"] || "").toString().trim();

        if (!full_address) {
          errors.push({ row: index + 2, message: "Alamat (full_address) is required." });
          return resolve();
        }

        // Check duplicate by full_address
        db.get(`SELECT id FROM address WHERE full_address = ?`, [full_address], (err, exists) => {
          if (err) {
            errors.push({ row: index + 2, message: "Database error." });
            return resolve();
          }
          if (exists) {
            errors.push({ row: index + 2, message: "Address already exists." });
            return resolve();
          }

          const query = `INSERT INTO address (full_address, rt, rw, village, district, city, postal_code)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
          db.run(query, [full_address, rt, rw, village, district, city, postal_code], function (err) {
            if (err) {
              errors.push({ row: index + 2, message: err.message });
            } else {
              inserted.push({ row: index + 2, id: this.lastID });
            }
            resolve();
          });
        });
      });
    });

    await Promise.all(tasks);
    db.close(() => {
      fs.unlink(req.file.path, () => {
        res.json({ success: true, inserted, errors });
      });
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: "Failed to process file." });
  }
});

module.exports = router;
