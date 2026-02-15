const db = require('../config/db');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

const Upload = {
  /**
   * Generate a unique slug for the shareable URL.
   */
  generateSlug() {
    return nanoid(12); // 12-char URL-safe id → ~2.2 × 10^21 combinations
  },

  /**
   * Create a new upload record.
   */
  create({
    slug,
    userId = null,
    type,
    textContent = null,
    originalFilename = null,
    storedFilename = null,
    mimeType = null,
    fileSize = null,
    password = null,
    isOneTime = false,
    maxViews = null,
    expiresAt,
    visibility = 'public',
    allowedUserIds = [],
  }) {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

    const stmt = db.prepare(`
      INSERT INTO uploads
        (slug, user_id, type, text_content, original_filename, stored_filename,
         mime_type, file_size, password_hash, is_one_time, max_views, expires_at, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      slug,
      userId,
      type,
      textContent,
      originalFilename,
      storedFilename,
      mimeType,
      fileSize,
      passwordHash,
      isOneTime ? 1 : 0,
      maxViews,
      expiresAt,
      visibility
    );

    // Insert allowed users for protected vaults
    if (visibility === 'protected' && allowedUserIds.length > 0) {
      const insertAccess = db.prepare(
        `INSERT OR IGNORE INTO vault_access (upload_id, user_id) VALUES (?, ?)`
      );
      const insertMany = db.transaction((ids) => {
        for (const uid of ids) {
          insertAccess.run(info.lastInsertRowid, uid);
        }
      });
      insertMany(allowedUserIds);
    }

    return Upload.findBySlug(slug);
  },

  findBySlug(slug) {
    return db
      .prepare(`SELECT * FROM uploads WHERE slug = ? AND is_deleted = 0`)
      .get(slug);
  },

  findById(id) {
    return db
      .prepare(`SELECT * FROM uploads WHERE id = ? AND is_deleted = 0`)
      .get(id);
  },

  /**
   * All uploads for a particular user (dashboard).
   */
  findByUserId(userId) {
    return db
      .prepare(
        `SELECT id, slug, type, original_filename, text_content, is_one_time,
                max_views, view_count, expires_at, created_at, password_hash,
                file_size, mime_type, visibility
         FROM uploads
         WHERE user_id = ? AND is_deleted = 0
         ORDER BY created_at DESC`
      )
      .all(userId);
  },

  /**
   * Get allowed user IDs for a protected upload.
   */
  getAllowedUsers(uploadId) {
    return db
      .prepare(
        `SELECT u.id, u.username, u.email
         FROM vault_access va
         JOIN users u ON u.id = va.user_id
         WHERE va.upload_id = ?`
      )
      .all(uploadId);
  },

  /**
   * Check if a user has access to a protected vault.
   */
  hasAccess(uploadId, userId) {
    const row = db
      .prepare(`SELECT 1 FROM vault_access WHERE upload_id = ? AND user_id = ?`)
      .get(uploadId, userId);
    return !!row;
  },

  /**
   * Check visibility-based access.
   * Returns { allowed: boolean, reason?: string, requiresAuth?: boolean }
   */
  checkVisibilityAccess(upload, requestingUserId = null) {
    if (upload.visibility === 'public') {
      return { allowed: true };
    }
    if (upload.visibility === 'private') {
      if (!requestingUserId) {
        return { allowed: false, reason: 'Authentication required.', requiresAuth: true };
      }
      if (upload.user_id !== requestingUserId) {
        return { allowed: false, reason: 'Access denied. This vault is private.' };
      }
      return { allowed: true };
    }
    if (upload.visibility === 'protected') {
      if (!requestingUserId) {
        return { allowed: false, reason: 'Authentication required.', requiresAuth: true };
      }
      if (upload.user_id === requestingUserId) {
        return { allowed: true }; // Owner always has access
      }
      if (!Upload.hasAccess(upload.id, requestingUserId)) {
        return { allowed: false, reason: 'Access denied. You are not authorized to view this vault.' };
      }
      return { allowed: true };
    }
    return { allowed: false, reason: 'Unknown visibility type.' };
  },

  /**
   * Increment view count; returns the updated record.
   */
  incrementViewCount(slug) {
    db.prepare(`UPDATE uploads SET view_count = view_count + 1 WHERE slug = ?`).run(slug);
    return Upload.findBySlug(slug);
  },

  /**
   * Soft-delete an upload.
   */
  softDelete(id) {
    db.prepare(`UPDATE uploads SET is_deleted = 1 WHERE id = ?`).run(id);
  },

  /**
   * Verify a link password.
   */
  verifyPassword(plaintext, hash) {
    return bcrypt.compareSync(plaintext, hash);
  },

  /**
   * Check whether the upload is still valid (not expired, not exceeded limits).
   * Returns { valid: boolean, reason?: string }
   */
  checkValidity(upload) {
    if (!upload || upload.is_deleted) {
      return { valid: false, reason: 'Content not found.' };
    }
    if (new Date(upload.expires_at + 'Z') <= new Date()) {
      return { valid: false, reason: 'This link has expired.' };
    }
    if (upload.is_one_time && upload.view_count >= 1) {
      return { valid: false, reason: 'This was a one-time link and has already been viewed.' };
    }
    if (upload.max_views && upload.view_count >= upload.max_views) {
      return { valid: false, reason: 'Maximum view/download limit reached.' };
    }
    return { valid: true };
  },

  // ── Cleanup helpers ───────────────────────────────────────────

  /**
   * Find all uploads that should be purged (expired *or* exceeded limits).
   */
  findExpired() {
    return db
      .prepare(
        `SELECT * FROM uploads
         WHERE is_deleted = 0
           AND (
             datetime(expires_at) <= datetime('now')
             OR (is_one_time = 1 AND view_count >= 1)
             OR (max_views IS NOT NULL AND view_count >= max_views)
           )`
      )
      .all();
  },

  /**
   * Hard-delete records + remove files from disk.
   */
  purge(records) {
    const deleteStmt = db.prepare(`DELETE FROM uploads WHERE id = ?`);
    const purgeMany = db.transaction((rows) => {
      for (const row of rows) {
        // Remove stored file if present
        if (row.stored_filename) {
          const filepath = path.join(UPLOAD_DIR, row.stored_filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
        deleteStmt.run(row.id);
      }
    });
    purgeMany(records);
    return records.length;
  },
};

module.exports = Upload;
