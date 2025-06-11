const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const DB_PATH = path.join(__dirname, "../db/community.sqlite");

// Helper to safely close DB and delete uploaded file
function cleanup(db, filePath, res, result) {
  if (db) db.close();
  if (filePath) fs.unlink(filePath, () => {});
  if (res && result) res.json(result);
}

// === Preview Route ===
router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, errors: ["No file uploaded"] });

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (rows.length === 0) {
    cleanup(null, filePath, res, { success: true, data: [], errors: ["No data found in file."] });
    return;
  }

  const preview = [];
  const errors = [];

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      cleanup(db, filePath, res, { success: false, errors: ["Failed to open database"] });
      return;
    }
    db.run("PRAGMA foreign_keys = ON");
  });

  let completed = 0;
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const kk_number = (row["Nomor KK"] || "").toString().trim();
    const address_text = (row["Alamat Lengkap"] || "").toString().trim();

    if (!kk_number || !address_text) {
      errors.push({ row: rowNumber, message: "Missing KK number or address" });
      if (++completed === rows.length) {
        cleanup(db, filePath, res, { success: true, data: preview, errors });
      }
      return;
    }

    db.get("SELECT id FROM address WHERE full_address = ?", [address_text], (err, addressRow) => {
      if (err) {
        errors.push({ row: rowNumber, message: "Database error during address lookup." });
      } else if (!addressRow || !addressRow.id) {
        errors.push({ row: rowNumber, message: `Address not found: ${address_text}` });
      } else {
        preview.push({
          kk_number,
          address: address_text,
          address_id: addressRow.id,
        });
      }

      if (++completed === rows.length) {
        cleanup(db, filePath, res, { success: true, data: preview, errors });
      }
    });
  });
});

// === Bulk Import Route ===
router.post("/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const workbook = xlsx.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    cleanup(null, req.file.path, res, { success: false, errors: ["No data found in file."] });
    return;
  }

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      cleanup(db, req.file.path, res, { success: false, errors: ["Failed to open database"] });
      return;
    }
    db.run("PRAGMA foreign_keys = ON");
  });

  const inserted = [];
  const errors = [];

  // Using Promise.all with array of promises for parallelism
  const tasks = rows.map((row, index) => {
    return new Promise((resolve) => {
      const rowNumber = index + 2;
      const kk_number = (row["Nomor KK"] || "").toString().trim();
      const full_address = (row["Alamat Lengkap"] || "").toString().trim();

      if (!kk_number || !full_address) {
        errors.push({ row: rowNumber, message: "Required fields missing." });
        return resolve();
      }

      // Check for duplicate KK number first
      db.get("SELECT kk_number FROM households WHERE kk_number = ?", [kk_number], (err, exists) => {
        if (err) {
          errors.push({ row: rowNumber, message: "Database error checking duplicate KK." });
          return resolve();
        }
        if (exists) {
          errors.push({ row: rowNumber, message: "KK already exists." });
          return resolve();
        }

        // Lookup address by full_address
        db.get("SELECT id FROM address WHERE full_address = ?", [full_address], (err, addr) => {
          if (err) {
            errors.push({ row: rowNumber, message: "Database error during address lookup." });
            return resolve();
          }
          if (!addr || !addr.id) {
            errors.push({ row: rowNumber, message: "Address not found or missing ID." });
            return resolve();
          }

          const query = "INSERT INTO households (kk_number, address_id) VALUES (?, ?)";
          db.run(query, [kk_number, addr.id], function (err) {
            if (err) {
              errors.push({ row: rowNumber, message: err.message });
            } else {
              inserted.push({ row: rowNumber, kk_number, id: this.lastID });
            }
            resolve();
          });
        });
      });
    });
  });

  await Promise.all(tasks);

  cleanup(db, req.file.path, res, { success: true, inserted, errors });
});

module.exports = router;
