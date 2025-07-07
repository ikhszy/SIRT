const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const DB_PATH = path.join(__dirname, "../db/community.sqlite");

function cleanup(db, filePath, res, result) {
  if (db) db.close();
  if (filePath) fs.unlink(filePath, () => {});
  if (res && result) res.json(result);
}

function formatExcelDate(input) {
  if (!input) return "";
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate())).toISOString().split("T")[0];
  }
  if (typeof input === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + input * 86400000);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().split("T")[0];
  }
  if (typeof input === "string" && input.includes("/")) {
    const [dd, mm, yyyy] = input.split("/").map(Number);
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
      return new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().split("T")[0];
    }
  }
  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString().split("T")[0];
  }
  return "";
}

function formatDisplayDate(input) {
  if (!input) return "";
  if (typeof input === "number") {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const result = new Date(epoch.getTime() + input * 86400000);
    return formatDateParts(new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth(), result.getUTCDate())));
  }
  if (typeof input === "string" && input.includes("/")) {
    const [dd, mm, yyyy] = input.split("/").map(Number);
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
      return formatDateParts(new Date(Date.UTC(yyyy, mm - 1, dd)));
    }
  }
  const parsed = new Date(input);
  if (!isNaN(parsed)) {
    return formatDateParts(new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())));
  }
  return "";
}

function formatDateParts(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
    education: (row["Pendidikan Terakhir"] || "").toString().trim(),
    occupation: (row["Pekerjaan"] || "").toString().trim(),
    citizenship: (row["Kewarganegaraan"] || "").toString().trim(),
    status: (row["Status NIK"] || "").toString().trim(),
    status_remarks: (row["Alasan tidak aktif"] || "").toString().trim(),
  };
}

router.post("/preview", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, errors: ["No file uploaded"] });

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  if (rows.length === 0) {
    return cleanup(null, filePath, res, {
      success: true,
      data: [],
      errors: ["No data found."],
    });
  }

  const preview = [];
  const errors = [];
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return cleanup(db, filePath, res, { success: false, errors: ["DB error"] });
    db.run("PRAGMA foreign_keys = ON");
  });

  let completed = 0;
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const trimmed = (v) => (typeof v === "string" ? v.trim() : v ?? "");

    // Extract and prepare relationship
    let relationship = trimmed(row["Status dalam Keluarga"]);
    const relationshipRemarks = trimmed(row["Keterangan Status Lainnya"]);
    if (relationship.toLowerCase() === "lainnya") {
      if (!relationshipRemarks) {
        errors.push({ row: rowNumber, message: "Keterangan Lainnya wajib diisi jika Status dalam Keluarga adalah 'Lainnya'" });
      }
      relationship = `Lainnya - ${relationshipRemarks}`;
    }

    const data = {
      full_name: trimmed(row["Nama Lengkap"]),
      nik: trimmed(row["NIK"]),
      kk_number: trimmed(row["Nomor KK"]),
      gender: trimmed(row["Jenis Kelamin"]),
      birthplace: trimmed(row["Tempat Lahir"]),
      birthdate: trimmed(row["Tanggal Lahir"]),
      blood_type: trimmed(row["Gol. Darah"]),
      religion: trimmed(row["Agama"]),
      marital_status: trimmed(row["Status Perkawinan"]),
      relationship,
      education: trimmed(row["Pendidikan Terakhir"]),
      occupation: trimmed(row["Pekerjaan"]),
      citizenship: trimmed(row["Kewarganegaraan"]),
      status: trimmed(row["Status NIK"]),
      status_remarks: trimmed(row["Alasan Tidak Aktif"]),
    };

    // Validation: minimal required fields
    if (!data.full_name || !data.nik || !data.kk_number) {
      errors.push({ row: rowNumber, message: "Kolom wajib di isi (Nama, NIK, KK)" });
      if (++completed === rows.length)
        cleanup(db, filePath, res, { success: true, data: preview, errors });
      return;
    }

    // Household check
    db.get(
      `SELECT h.status_kepemilikan_rumah, a.id, a.full_address 
       FROM households h 
       JOIN address a ON h.address_id = a.id 
       WHERE h.kk_number = ?`,
      [data.kk_number],
      (err, row) => {
        if (err || !row) {
          errors.push({ row: rowNumber, message: `Alamat tidak ditemukan untuk KK: ${data.kk_number}` });
        } else {
          const isOutsider = row.status_kepemilikan_rumah === "pemilik belum pindah";
          preview.push({
            ...data,
            status: isOutsider ? "tidak aktif - domisili diluar" : data.status,
            status_remarks: isOutsider ? "" : (data.status === "tidak aktif - lainnya" ? data.status_remarks : ""),
            full_address: row.full_address,
            address_id: row.id,
            row: rowNumber,
            relationship_remarks: relationship.startsWith("Lainnya - ") ? relationship.split("Lainnya - ")[1] : "",
          });
        }

        if (++completed === rows.length)
          cleanup(db, filePath, res, { success: true, data: preview, errors });
      }
    );
  });
});

router.post("/bulk", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  if (rows.length === 0) {
    return cleanup(null, filePath, res, { success: false, errors: ["No data found"] });
  }

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) return cleanup(db, filePath, res, { success: false, errors: ["DB error"] });
    db.run("PRAGMA foreign_keys = ON");
  });

  const inserted = [];
  const errors = [];

  const tasks = rows.map((row, index) => new Promise((resolve) => {
    const rowNumber = index + 2;
    const trimmed = (v) => (typeof v === "string" ? v.trim() : v ?? "");

    let relationship = trimmed(row["Status dalam Keluarga"]);
    const relationshipRemarks = trimmed(row["Keterangan Status Lainnya"]);
    if (relationship.toLowerCase() === "lainnya") {
      if (!relationshipRemarks) {
        errors.push({ row: rowNumber, message: "Keterangan Lainnya wajib diisi jika Status dalam Keluarga adalah 'Lainnya'" });
        return resolve();
      }
      relationship = `Lainnya - ${relationshipRemarks}`;
    }

    const data = {
      full_name: trimmed(row["Nama Lengkap"]),
      nik: trimmed(row["NIK"]),
      kk_number: trimmed(row["Nomor KK"]),
      gender: trimmed(row["Jenis Kelamin"]),
      birthplace: trimmed(row["Tempat Lahir"]),
      birthdate: trimmed(row["Tanggal Lahir"]),
      blood_type: trimmed(row["Gol. Darah"]),
      religion: trimmed(row["Agama"]),
      marital_status: trimmed(row["Status Perkawinan"]),
      relationship,
      education: trimmed(row["Pendidikan Terakhir"]),
      occupation: trimmed(row["Pekerjaan"]),
      citizenship: trimmed(row["Kewarganegaraan"]),
      status: trimmed(row["Status NIK"]),
      status_remarks: trimmed(row["Alasan Tidak Aktif"]),
    };

    // Basic validation
    if (!data.full_name || !data.nik || !data.kk_number) {
      errors.push({ row: rowNumber, message: "Kolom wajib kosong (Nama, NIK, KK)" });
      return resolve();
    }

    // Check for duplicate NIK
    db.get("SELECT id FROM residents WHERE nik = ?", [data.nik], (err, found) => {
      if (err || found) {
        errors.push({ row: rowNumber, message: found ? "NIK sudah terdaftar" : "DB error saat cek NIK" });
        return resolve();
      }

      // Check KK exists and get address
      db.get(`SELECT h.status_kepemilikan_rumah, a.id 
              FROM households h 
              JOIN address a ON h.address_id = a.id 
              WHERE h.kk_number = ?`,
        [data.kk_number],
        (err, addr) => {
          if (err || !addr) {
            errors.push({ row: rowNumber, message: `Alamat tidak ditemukan untuk KK: ${data.kk_number}` });
            return resolve();
          }

          const isOutsider = addr.status_kepemilikan_rumah === "pemilik belum pindah";
          const status = isOutsider ? "tidak aktif - domisili diluar" : data.status;
          const status_remarks = isOutsider ? "" : (data.status === "tidak aktif - lainnya" ? data.status_remarks : null);

          const query = `INSERT INTO residents 
            (full_name, nik, kk_number, gender, birthplace, birthdate, blood_type, religion, marital_status, relationship, education, occupation, citizenship, address_id, status, status_remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          const values = [
            data.full_name,
            data.nik,
            data.kk_number,
            data.gender,
            data.birthplace,
            data.birthdate,
            data.blood_type,
            data.religion,
            data.marital_status,
            data.relationship,
            data.education,
            data.occupation,
            data.citizenship,
            addr.id,
            status,
            status_remarks
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
  }));

  await Promise.all(tasks);
  cleanup(db, filePath, res, { success: true, inserted, errors });
});

module.exports = router;
