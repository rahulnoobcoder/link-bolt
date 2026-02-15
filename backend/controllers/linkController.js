const path = require('path');
const Upload = require('../models/Upload');
require('dotenv').config();

// Helper to extract user id from optionalAuth
function getRequestUserId(req) {
  return req.user ? req.user.id : null;
}

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

/**
 * GET /api/link/:slug/meta
 * Returns metadata about a link (whether it needs a password, type, etc.)
 * Does NOT increment view count.
 */
exports.getLinkMeta = (req, res) => {
  try {
    const upload = Upload.findBySlug(req.params.slug);

    if (!upload) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    const validity = Upload.checkValidity(upload);
    if (!validity.valid) {
      return res.status(410).json({ error: validity.reason });
    }

    // Check visibility access
    const visCheck = Upload.checkVisibilityAccess(upload, getRequestUserId(req));
    if (!visCheck.allowed) {
      const status = visCheck.requiresAuth ? 401 : 403;
      return res.status(status).json({
        error: visCheck.reason,
        requiresAuth: !!visCheck.requiresAuth,
        accessDenied: !visCheck.requiresAuth,
      });
    }

    return res.json({
      slug: upload.slug,
      type: upload.type,
      hasPassword: !!upload.password_hash,
      isOneTime: !!upload.is_one_time,
      maxViews: upload.max_views,
      viewCount: upload.view_count,
      expiresAt: upload.expires_at,
      originalFilename: upload.original_filename,
      mimeType: upload.mime_type,
      fileSize: upload.file_size,
      visibility: upload.visibility,
    });
  } catch (err) {
    console.error('Get link meta error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/link/:slug
 * Access the actual content. Body may include { password } if required.
 * Increments view count.
 */
exports.accessLink = (req, res) => {
  try {
    const upload = Upload.findBySlug(req.params.slug);

    if (!upload) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    const validity = Upload.checkValidity(upload);
    if (!validity.valid) {
      return res.status(410).json({ error: validity.reason });
    }

    // Check visibility access
    const visCheck = Upload.checkVisibilityAccess(upload, getRequestUserId(req));
    if (!visCheck.allowed) {
      const status = visCheck.requiresAuth ? 401 : 403;
      return res.status(status).json({
        error: visCheck.reason,
        requiresAuth: !!visCheck.requiresAuth,
        accessDenied: !visCheck.requiresAuth,
      });
    }

    // Password check
    if (upload.password_hash) {
      const { password } = req.body || {};
      if (!password) {
        return res.status(401).json({ error: 'This link is password-protected.', requiresPassword: true });
      }
      if (!Upload.verifyPassword(password, upload.password_hash)) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    // Increment view count
    const updated = Upload.incrementViewCount(upload.slug);

    if (upload.type === 'text') {
      return res.json({
        type: 'text',
        textContent: updated.text_content,
        viewCount: updated.view_count,
        maxViews: updated.max_views,
        isOneTime: !!updated.is_one_time,
        expiresAt: updated.expires_at,
      });
    }

    // File: send download metadata (actual download via separate endpoint)
    return res.json({
      type: 'file',
      originalFilename: updated.original_filename,
      mimeType: updated.mime_type,
      fileSize: updated.file_size,
      viewCount: updated.view_count,
      maxViews: updated.max_views,
      isOneTime: !!updated.is_one_time,
      expiresAt: updated.expires_at,
      downloadUrl: `/api/link/${updated.slug}/download`,
    });
  } catch (err) {
    console.error('Access link error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/link/:slug/download
 * Stream the actual file to the client. Password is passed via query param
 * (since the browser needs a direct link for download).
 */
exports.downloadFile = (req, res) => {
  try {
    const upload = Upload.findBySlug(req.params.slug);

    if (!upload) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    const validity = Upload.checkValidity(upload);
    if (!validity.valid) {
      return res.status(410).json({ error: validity.reason });
    }

    if (upload.type !== 'file') {
      return res.status(400).json({ error: 'This link does not contain a file.' });
    }

    // Check visibility access
    const visCheck = Upload.checkVisibilityAccess(upload, getRequestUserId(req));
    if (!visCheck.allowed) {
      const status = visCheck.requiresAuth ? 401 : 403;
      return res.status(status).json({ error: visCheck.reason });
    }

    // Password check via query string for downloads
    if (upload.password_hash) {
      const pw = req.query.password;
      if (!pw || !Upload.verifyPassword(pw, upload.password_hash)) {
        return res.status(401).json({ error: 'Password required for download.' });
      }
    }

    const filepath = path.join(UPLOAD_DIR, upload.stored_filename);
    return res.download(filepath, upload.original_filename);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
