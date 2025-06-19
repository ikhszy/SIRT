const db = require('../db/db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// Helper to safely clean up DB and uploaded file
function cleanup(db, filePath, res, result) {
  if (db) db.close();
  if (filePath) fs.unlink(filePath, () => {});
  if (res && result) res.json(result);
}

const getAllInventory = async (req, res) => {
  const { name, condition, location, description } = req.query;
  let filters = [];
  let values = [];

  if (name) {
    filters.push("name LIKE ?");
    values.push(`%${name}%`);
  }
  if (condition) {
    filters.push("condition = ?");
    values.push(condition);
  }
  if (location) {
    filters.push("location LIKE ?");
    values.push(`%${location}%`);
  }
  if (description) {
    filters.push("description LIKE ?");
    values.push(`%${description}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const sql = `SELECT * FROM inventory_items ${whereClause} ORDER BY name ASC`;

  try {
    const rows = await db.all(sql, values);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getInventoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const row = await db.get('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addInventory = async (req, res) => {
  const { name, quantity, condition, description, location } = req.body;
  try {
    const stmt = `
      INSERT INTO inventory_items (name, quantity, condition, description, location)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.run(stmt, [name, quantity, condition, description, location]);
    res.status(201).json({ message: 'Item added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateInventory = async (req, res) => {
  const { id } = req.params;
  const { name, quantity, condition, description, location } = req.body;
  try {
    const stmt = `
      UPDATE inventory_items
      SET name = ?, quantity = ?, condition = ?, description = ?, location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(stmt, [name, quantity, condition, description, location, id]);
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteInventory = async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM inventory_items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk import inventory from Excel
const bulkImportInventory = async (req, res) => {
  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, message: 'File upload failed' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows.length) {
      cleanup(null, filePath, res, { success: false, errors: ['No data found in file.'] });
      return;
    }

    const db = require('../db/db');
    const inserted = [];
    const errors = [];

    // Process rows sequentially or with Promise.all (depending on your DB lib)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel row number offset (header row)

      // Map Excel columns to DB fields
      const name = (row['Nama Barang'] || '').toString().trim();
      const quantityRaw = row['Jumlah Barang'];
      const quantity = Number(quantityRaw);
      const condition = (row['Kondisi Barang'] || '').toString().trim();
      const description = (row['Keterangan'] || '').toString().trim();
      const location = (row['Lokasi Barang'] || '').toString().trim();

      // Validate required fields
      if (!name || isNaN(quantity) || quantity < 0) {
        errors.push({ row: rowNumber, message: 'Missing or invalid Nama Barang or Jumlah Barang' });
        continue;
      }

      try {
        const stmt = `
          INSERT INTO inventory_items (name, quantity, condition, description, location)
          VALUES (?, ?, ?, ?, ?)
        `;
        await db.run(stmt, [name, quantity, condition, description, location]);
        inserted.push({ row: rowNumber, name });
      } catch (err) {
        errors.push({ row: rowNumber, message: err.message });
      }
    }

    cleanup(null, filePath, res, { success: true, inserted, errors });
  });
};

const previewInventoryImport = (req, res) => {
  upload.single('file')(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, errors: ['File upload failed'] });
    if (!req.file) return res.status(400).json({ success: false, errors: ['No file uploaded'] });

    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      fs.unlink(filePath, () => {});
      return res.json({ success: true, data: [], errors: ['No data found in file.'] });
    }

    const preview = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row numbering

      const name = (row['Nama Barang'] || '').toString().trim();
      const quantityRaw = row['Jumlah Barang'];
      const quantity = Number(quantityRaw);
      const condition = (row['Kondisi Barang'] || '').toString().trim();
      const description = (row['Keterangan'] || '').toString().trim();
      const location = (row['Lokasi Barang'] || '').toString().trim();

      // Validate required fields
      if (!name || isNaN(quantity) || quantity < 0) {
        errors.push({ row: rowNumber, message: 'Missing or invalid Nama Barang or Jumlah Barang' });
      }

      preview.push({ name, quantity: quantityRaw, condition, description, location });
    });

    fs.unlink(filePath, () => {});
    res.json({ success: true, data: preview, errors });
  });
};


module.exports = {
  getAllInventory,
  getInventoryById,
  addInventory,
  updateInventory,
  deleteInventory,
  bulkImportInventory,
  previewInventoryImport
};
