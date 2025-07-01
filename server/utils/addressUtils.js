const db = require('../db/db');

function normalizeAddress(address) {
  return (address || "")
    .toString()
    .normalize("NFKC")
    .replace(/\s+/g, " ")           // Replace multiple spaces with one
    .replace(/[\r\n\t]/g, "")       // Remove line breaks and tabs
    .replace(/\u00A0/g, " ")        // Replace non-breaking space
    .trim()
    .toLowerCase();
}

async function getAllAddressesMap() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, full_address FROM address`, [], (err, rows) => {
      if (err) {
        console.error("❌ Error loading addresses:", err);
        return reject(err);
      }
      const map = new Map();
      rows.forEach(row => {
        const key = normalizeAddress(row.full_address);
        map.set(key, row); // row = { id, full_address }
      });
      resolve(map);
    });
  });
}

module.exports = { getAllAddressesMap, normalizeAddress };