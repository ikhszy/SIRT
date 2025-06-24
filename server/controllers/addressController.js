const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../db/community.sqlite");

// Helper: open DB
const getDb = () => new sqlite3.Database(dbPath);

// GET all addresses
exports.getAllAddresses = (req, res) => {
  const db = getDb();
  db.all("SELECT * FROM address ORDER BY created_at DESC", [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET one address
exports.getAddressById = (req, res) => {
  const db = getDb();
  db.get("SELECT * FROM address WHERE id = ?", [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Address not found" });
    res.json(row);
  });
};

// CREATE address
exports.createAddress = (req, res) => {
  const { full_address } = req.body;
  if (!full_address) return res.status(400).json({ error: "full_address is required" });

  const db = getDb();
  const sql = `INSERT INTO address (full_address) VALUES (?)`;

  db.run(sql, [full_address], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
};

// UPDATE address
exports.updateAddress = (req, res) => {
  const { full_address } = req.body;
  if (!full_address) return res.status(400).json({ error: "full_address is required" });

  const db = getDb();
  const sql = `UPDATE address SET full_address = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(sql, [full_address, req.params.id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Address updated successfully" });
  });
};

// DELETE address
exports.deleteAddress = (req, res) => {
  const db = getDb();
  const sql = `DELETE FROM address WHERE id = ?`;

  db.run(sql, [req.params.id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(204).end();
  });
};

// CHECK for duplicate address
exports.checkDuplicateAddress = (req, res) => {
  const { normalized_address } = req.query;
  if (!normalized_address) {
    return res.status(400).json({ error: "normalized_address is required" });
  }

  const db = getDb();
  db.all("SELECT full_address FROM address", [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });

    const normalize = (text) =>
      text.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

    const exists = rows.some((row) => normalize(row.full_address) === normalized_address);
    res.json({ exists });
  });
};