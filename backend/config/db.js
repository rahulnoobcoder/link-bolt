const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/linkvault.db';
const dbDir = path.dirname(path.resolve(DB_PATH));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT    NOT NULL UNIQUE,
    user_id           INTEGER,
    type              TEXT    NOT NULL CHECK(type IN ('text', 'file')),
    -- text content (stored inline for text pastes)
    text_content      TEXT,
    -- file metadata
    original_filename TEXT,
    stored_filename   TEXT,
    mime_type         TEXT,
    file_size         INTEGER,
    -- link settings
    password_hash     TEXT,
    is_one_time       INTEGER NOT NULL DEFAULT 0,
    max_views         INTEGER,
    view_count        INTEGER NOT NULL DEFAULT 0,
    expires_at        TEXT    NOT NULL,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    -- soft-delete flag (cleanup job hard-deletes)
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    -- visibility: 'public' | 'private' | 'protected'
    visibility        TEXT    NOT NULL DEFAULT 'public',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Junction table for protected vault access
  CREATE TABLE IF NOT EXISTS vault_access (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id  INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    granted_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    UNIQUE(upload_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_uploads_slug       ON uploads(slug);
  CREATE INDEX IF NOT EXISTS idx_uploads_user_id    ON uploads(user_id);
  CREATE INDEX IF NOT EXISTS idx_uploads_expires_at ON uploads(expires_at);
  CREATE INDEX IF NOT EXISTS idx_vault_access_upload ON vault_access(upload_id);
  CREATE INDEX IF NOT EXISTS idx_vault_access_user   ON vault_access(user_id);
`);

module.exports = db;
