const db = require('../db/db');

function normalizeAddress(address) {
  return (address || "")
    .toString()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[\r\n\t]/g, "")
    .replace(/\u00A0/g, " ")
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

      const map = {}; // <--- FIX: use Map instead of object
      rows.forEach(row => {
        const key = normalizeAddress(row.full_address);
        map.set(key, row); // { id, full_address }
      });
      resolve(map);
    });
  });
}

module.exports = { getAllAddressesMap, normalizeAddress };