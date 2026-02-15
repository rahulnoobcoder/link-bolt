const db = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const User = {
  /**
   * Create a new user (username-only registration).
   * @returns {{ id, username, email, created_at }}
   */
  create({ username, email = null, password }) {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = db.prepare(
      `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`
    );
    const info = stmt.run(username, email, hash);
    return User.findById(info.lastInsertRowid);
  },

  findById(id) {
    return db.prepare(`SELECT id, username, email, created_at FROM users WHERE id = ?`).get(id);
  },

  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  },

  findByUsername(username) {
    return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  },

  /**
   * Search users by username (for protected vault user picker).
   * Excludes the requesting user.
   */
  search(query, excludeUserId = null) {
    if (excludeUserId) {
      return db
        .prepare(
          `SELECT id, username, email FROM users
           WHERE id != ? AND username LIKE ?
           ORDER BY username ASC LIMIT 20`
        )
        .all(excludeUserId, `%${query}%`);
    }
    return db
      .prepare(
        `SELECT id, username, email FROM users
         WHERE username LIKE ?
         ORDER BY username ASC LIMIT 20`
      )
      .all(`%${query}%`);
  },

  /**
   * Verify plaintext password against stored hash.
   */
  verifyPassword(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash);
  },
};

module.exports = User;
