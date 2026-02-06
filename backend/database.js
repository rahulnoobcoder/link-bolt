const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'linkvault.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Consolidating schema here. Added 'password' column.
    db.run(`CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        type TEXT,
        content TEXT,
        filename TEXT,
        filepath TEXT,
        expiresAt INTEGER,
        password TEXT
    )`);
});

module.exports = db;