const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/db/database.sqlite');

// Create a simple "residents" table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      birthdate TEXT,
      family_size INTEGER
    )
  `);
});

db.close();