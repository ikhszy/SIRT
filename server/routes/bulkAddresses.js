const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const upload = multer({ dest: "uploads/" });
const dbPath = path.join(__dirname, "../db/community.sqlite");

function normalizeAddress(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD") // Normalize unicode (for safety)
    .replace(/[^\w\s]/g, "") // remove punctuation, keep spaces
    .replace(/\s+/g, " ")    // collapse multiple spaces
    .trim();
}


// POST /api/address-import/preview
router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    fs.unlink(req.file.path, () => {}); // delete temp file

    const db = new sqlite3.Database(dbPath);

    db.all("SELECT full_address FROM address", (err, existingRows) => {
      if (err) {
        db.close();
        return res.status(500).json({ success: false, message: "DB error during preview" });
      }

      db.get("SELECT * FROM commonSettings", (err2, settings) => {
        if (err2 || !settings) {
          db.close();
          return res.status(500).json({ success: false, message: "Failed to read settings" });
        }

        const existingSet = new Set(
          existingRows.map((row) => normalizeAddress(row.full_address))
        );

        const seenInThisFile = new Set();
        const errors = [];

        const dataWithWarnings = rows.map((row, idx) => {
          const userInput = (row["Alamat Lengkap"] || "").toString().trim();
          const rowNumber = idx + 2;

          // build full address like import
          const fullCombinedAddress = `${userInput} RT ${settings.rt} RW ${settings.rw}, Kelurahan ${settings.kelurahan}, Kecamatan ${settings.kecamatan}, ${settings.kota} ${settings.kodepos}`;
          const normalizedFull = normalizeAddress(fullCombinedAddress);

          const isDuplicate =
            existingSet.has(normalizedFull) || seenInThisFile.has(normalizedFull);

          if (isDuplicate) {
            errors.push({
              row: rowNumber,
              message: "Alamat serupa sudah ada",
            });
          }

          seenInThisFile.add(normalizedFull);

          return {
            ...row,
            __rowNumber: rowNumber,
            __duplicate: isDuplicate,
          };
        });

        db.close();
        return res.json({ success: true, data: dataWithWarnings, errors });
      });
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    return res.status(500).json({ success: false, message: "Failed to parse file" });
  }
});

// Helper to get commonSettings inside route
const getCommonSettings = (db) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT rt, rw, kelurahan, kecamatan, kota, kodepos FROM commonSettings LIMIT 1`,
      (err, row) => {
        if (err) return reject(err);
        resolve(row || {});
      }
    );
  });
};

// POST /api/address-import/bulk
router.post("/bulk", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  const db = new sqlite3.Database(dbPath);

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const commonSettings = await getCommonSettings(db);

    const inserted = [];
    const errors = [];

    const tasks = rows.map((row, index) => {
      return new Promise((resolve) => {
        const uploadedFullAddress = (row["Alamat Lengkap"] || "").toString().trim();

        if (!uploadedFullAddress) {
          errors.push({ row: index + 2, message: "Alamat (full_address) is required." });
          return resolve();
        }

        // Compose combined full address string
        const combinedFullAddress = `${uploadedFullAddress} RT ${commonSettings.rt} RW ${commonSettings.rw} Kelurahan ${commonSettings.kelurahan}, Kecamatan ${commonSettings.kecamatan}, ${commonSettings.kota} ${commonSettings.kodepos}`;

        // Check duplicate by combined full_address
        db.get(`SELECT id FROM address WHERE full_address = ?`, [combinedFullAddress], (err, exists) => {
          if (err) {
            errors.push({ row: index + 2, message: "Database error: " + err.message });
            return resolve();
          }
          if (exists) {
            errors.push({ row: index + 2, message: "Address already exists." });
            return resolve();
          }

          const query = `INSERT INTO address (full_address) VALUES (?)`;
          db.run(query, [combinedFullAddress], function (err) {
            if (err) {
              errors.push({ row: index + 2, message: "Insert error: " + err.message });
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
    console.error(err);
    fs.unlink(req.file.path, () => {});
    db.close();
    res.status(500).json({ success: false, message: "Failed to process file." });
  }
});

module.exports = router;
