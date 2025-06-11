const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const DB_PATH = path.join(__dirname, "../db/community.sqlite");

// Cleanup temp file and optionally respond
function cleanup(db, filePath, res, result) {
  if (db) db.close();
  if (filePath) fs.unlink(filePath, () => {});
  if (res && result) res.json(result);
}

// Format Excel-style or native Date to 'YYYY-MM-DD'
function formatExcelDate(input) {
  if (!input) return "";

  if (input instanceof Date) {
    // Use UTC to avoid timezone shifts
    return new Date(Date.UTC(
      input.getFullYear(),
      input.getMonth(),
      input.getDate()
    )).toISOString().split("T")[0];
  }

  if (typeof input === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + input * 86400000);
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )).toISOString().split("T")[0];
  }

  if (typeof input === "string" && input.includes("/")) {
    // Handle DD/MM/YYYY format explicitly here if you expect it sometimes
    const [dd, mm, yyyy] = input.split("/").map(Number);
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
      const date = new Date(Date.UTC(yyyy, mm - 1, dd));
      return date.toISOString().split("T")[0];
    }
  }

  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    return new Date(Date.UTC(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    )).toISOString().split("T")[0];
  }

  return ""; // fallback
}

// Convert date to DD-MM-YYYY (used in preview)
function formatDisplayDate(input) {
  if (!input) return "";

  // Case 1: Excel serial number (e.g., 32000)
  if (typeof input === "number") {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const result = new Date(epoch.getTime() + input * 86400000);
    return formatDateParts(new Date(Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth(),
      result.getUTCDate()
    )));
  }

  // Case 2: "DD/MM/YYYY"
  if (typeof input === "string" && input.includes("/")) {
    const [dd, mm, yyyy] = input.split("/").map(Number);
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
      const result = new Date(Date.UTC(yyyy, mm - 1, dd));
      return formatDateParts(result);
    }
  }

  // Case 3: Try parsing ISO or other formats
  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    return formatDateParts(new Date(Date.UTC(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    )));
  }

  return "";
}

function formatDateParts(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // Safe and timezone-agnostic
}

// Extract standardized fields from Excel row
function extractFields(row, forDisplay = false) {
  const birthdateRaw = row["Tanggal Lahir"];
  const birthdate = forDisplay ? formatDisplayDate(birthdateRaw) : formatExcelDate(birthdateRaw);

  return {
    full_name: (row["Nama Lengkap"] || "").toString().trim(),
    nik: (row["NIK"] || "").toString().trim(),
    kk_number: (row["Nomor KK"] || "").toString().trim(),
    gender: (row["Jenis Kelamin"] || "").toString().trim(),
    birthplace: (row["Tempat Lahir"] || "").toString().trim(),
    birthdate,
    blood_type: (row["Gol. Darah"] || "").toString().trim(),
    religion: (row["Agama"] || "").toString().trim(),
    marital_status: (row["Status Perkawinan"] || "").toString().trim(),
    relationship: (row["Status dalam Keluarga"] || "").toString().trim(),
    education: (row["Pendidikan"] || "").toString().trim(),
    occupation: (row["Pekerjaan"] || "").toString().trim(),
    citizenship: (row["Kewarganegaraan"] || "").toString().trim(),
    address_text: (row["Alamat"] || "").toString().trim(),
    status: (row["Domisili"] || "").toString().trim(),
  };
}

// Preview Endpoint
router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, errors: ["No file uploaded"] });

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (rows.length === 0) {
    return cleanup(null, filePath, res, { success: true, data: [], errors: ["No data found in file."] });
  }

  const preview = [];
  const errors = [];

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return cleanup(db, filePath, res, { success: false, errors: ["Failed to open database"] });
    db.run("PRAGMA foreign_keys = ON");
  });

  let completed = 0;
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const data = extractFields(row, true); // display-friendly date

    if (!data.full_name || !data.nik || !data.kk_number || !data.address_text) {
      errors.push({ row: rowNumber, message: "Missing required fields (Nama Lengkap, NIK, KK, Alamat)" });
      if (++completed === rows.length) cleanup(db, filePath, res, { success: true, data: preview, errors });
      return;
    }

    db.get("SELECT id FROM address WHERE full_address = ?", [data.address_text], (err, addrRow) => {
      if (err) {
        errors.push({ row: rowNumber, message: "Database error during address lookup." });
      } else if (!addrRow) {
        errors.push({ row: rowNumber, message: `Address not found: ${data.address_text}` });
      } else {
        preview.push({ ...data, address_id: addrRow.id });
      }

      if (++completed === rows.length) cleanup(db, filePath, res, { success: true, data: preview, errors });
    });
  });
});

// Bulk Insert Endpoint
router.post("/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  if (rows.length === 0) {
    return cleanup(null, filePath, res, { success: false, errors: ["No data found in file."] });
  }

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return cleanup(db, filePath, res, { success: false, errors: ["Failed to open database"] });
    db.run("PRAGMA foreign_keys = ON");
  });

  const inserted = [];
  const errors = [];

  const tasks = rows.map((row, index) => {
    return new Promise((resolve) => {
      const rowNumber = index + 2;
      const data = extractFields(row, false); // raw format for DB

      if (!data.full_name || !data.nik || !data.kk_number || !data.address_text) {
        errors.push({ row: rowNumber, message: "Missing required fields (Nama Lengkap, NIK, KK, Alamat)" });
        return resolve();
      }

      db.get("SELECT id FROM residents WHERE nik = ?", [data.nik], (err, existing) => {
        if (err) {
          errors.push({ row: rowNumber, message: "Database error checking NIK." });
          return resolve();
        }
        if (existing) {
          errors.push({ row: rowNumber, message: "Duplicate NIK, already exists." });
          return resolve();
        }

        db.get("SELECT id FROM address WHERE full_address = ?", [data.address_text], (err, addr) => {
          if (err) {
            errors.push({ row: rowNumber, message: "Database error during address lookup." });
            return resolve();
          }
          if (!addr || !addr.id) {
            errors.push({ row: rowNumber, message: `Address not found: ${data.address_text}` });
            return resolve();
          }

          const query = `
            INSERT INTO residents (
              full_name, nik, kk_number, gender, birthplace, birthdate,
              blood_type, religion, marital_status, relationship,
              education, occupation, citizenship, address_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            data.full_name, data.nik, data.kk_number, data.gender, data.birthplace, data.birthdate,
            data.blood_type, data.religion, data.marital_status, data.relationship,
            data.education, data.occupation, data.citizenship, addr.id, data.status
          ];

          db.run(query, values, function (err) {
            if (err) {
              errors.push({ row: rowNumber, message: `Insert error: ${err.message}` });
            } else {
              inserted.push({ row: rowNumber, nik: data.nik, id: this.lastID });
            }
            resolve();
          });
        });
      });
    });
  });

  await Promise.all(tasks);
  cleanup(db, filePath, res, { success: true, inserted, errors });
});

module.exports = router;
