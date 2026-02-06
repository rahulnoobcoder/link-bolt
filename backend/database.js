const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database (creates a file named linkvault.db)
const dbPath = path.resolve(__dirname, 'linkvault.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Initialize Table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'text' or 'file'
        content TEXT,       -- Stores actual text or file path
        originalName TEXT,  -- Only for files
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME
    )`);
});

module.exports = db;