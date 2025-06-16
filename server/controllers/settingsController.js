const db = require('../db/db.js');

const getSettings = async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM commonSettings WHERE id = 1');
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettings = async (req, res) => {
  const { rt, rw, kecamatan, kelurahan, kota, kodepos } = req.body;
  const query = `
    UPDATE commonSettings
    SET rt = ?, rw = ?, kecamatan = ?, kelurahan = ?, kota = ?, kodepos = ?
    WHERE id = 1
  `;
  try {
    await db.run(query, [rt, rw, kecamatan, kelurahan, kota, kodepos]);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSettings, updateSettings };