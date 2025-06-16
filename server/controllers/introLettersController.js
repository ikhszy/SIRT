// server/controllers/introLettersController.js
const db = require('../db/db');

const getAllLetters = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let filters = [];
    let values = [];

    if (search) {
      filters.push(`(r.full_name LIKE ? OR il.nik LIKE ?)`);
      values.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      filters.push(`il.letterStatus = ?`);
      values.push(status);
    }

    if (startDate && endDate) {
      filters.push(`DATE(il.date_created) BETWEEN DATE(?) AND DATE(?)`);
      values.push(startDate, endDate);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sql = `
      SELECT il.*, r.full_name
      FROM intro_letters il
      LEFT JOIN residents r ON il.nik = r.nik
      ${whereClause}
      ORDER BY il.date_created DESC
      LIMIT ? OFFSET ?
    `;

    values.push(parseInt(limit), parseInt(offset));

    const rows = await db.all(sql, values);
    res.json(rows);
  } catch (err) {
    console.error('GET letters failed:', err);
    res.status(500).json({ error: err.message });
  }
};


const getLetterById = async (req, res) => {
  try {
    const sql = `
      SELECT il.*, r.*, a.full_address
      FROM intro_letters il
      LEFT JOIN residents r ON il.nik = r.nik
      LEFT JOIN address a ON r.address_id = a.id
      WHERE il.id = ?
    `;
    const row = await db.get(sql, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Letter not found' });
    res.json(row);
  } catch (err) {
    console.error('GET letter by id failed:', err);
    res.status(500).json({ error: err.message });
  }
};

const createLetter = async (req, res) => {
  try {
    const { nik, letterPurpose, letterNumber } = req.body;
    const sql = `
      INSERT INTO intro_letters (nik, letterPurpose, letterNumber)
      VALUES (?, ?, ?)
    `;
    const result = await db.run(sql, [nik, letterPurpose, letterNumber]);
    res.status(201).json({ id: result.lastID });
  } catch (err) {
    console.error('CREATE letter failed:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateLetterStatus = async (req, res) => {
  try {
    const { letterStatus } = req.body;
    const sql = `
      UPDATE intro_letters
      SET letterStatus = ?, date_modified = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await db.run(sql, [letterStatus, req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    res.json({ message: 'Letter status updated' });
  } catch (err) {
    console.error('UPDATE letter failed:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllLetters,
  getLetterById,
  createLetter,
  updateLetterStatus
};
