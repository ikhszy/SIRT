const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.resolve(__dirname, "../db/community.sqlite");
const db = new sqlite3.Database(dbPath);

// Get all users (hide password)
exports.getAllUsers = (req, res) => {
  const query = `SELECT userId, username, role, date_created FROM users`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Add new user
exports.addUser = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, password, role, date_created, date_modified)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `;
    const params = [username, hashedPassword, role || null];

    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'User created', userId: this.lastID });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single user by ID
exports.getUserById = (req, res) => {
  const { id } = req.params;
  const query = `SELECT userId, username, role FROM users WHERE userId = ?`;
  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
};

// Update user by ID (optional password hashing)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    let query = `UPDATE users SET username = ?, role = ?, date_modified = datetime('now')`;
    const params = [username, role];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = ?`;
      params.push(hashedPassword);
    }

    query += ` WHERE userId = ?`;
    params.push(id);

    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User updated' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete user by ID
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM users WHERE userId = ?`;

  db.run(query, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  });
};
