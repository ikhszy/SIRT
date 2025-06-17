const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');

const dbPath = path.resolve(__dirname, '../db/community.sqlite');
const db = new sqlite3.Database(dbPath);

const cutoff = dayjs().subtract(24, 'month').format('MM-YYYY');

const sql = `DELETE FROM donation_history WHERE month < ?`;

db.run(sql, [cutoff], function (err) {
  if (err) {
    console.error('❌ Error deleting old records:', err.message);
  } else {
    console.log(`✅ Deleted ${this.changes} old donation_history records older than ${cutoff}`);
  }
  db.close();
});
