// infractionDatabase.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Opens (or creates) infractions.db in the same folder as this file
const dbPath = path.join(__dirname, 'infractions.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('❌ SQLite connection error:', err);
  else console.log('✅ Connected to infractions.db');
});

// Ensure the table exists
db.run(`
  CREATE TABLE IF NOT EXISTS infractions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    punisher_id TEXT NOT NULL,
    punishment TEXT NOT NULL,
    reason TEXT NOT NULL,
    proof TEXT,
    appealable TEXT,
    approved_by TEXT,
    timestamp TEXT NOT NULL
  )
`);

module.exports = db;
