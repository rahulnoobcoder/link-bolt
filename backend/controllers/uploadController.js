const Upload = require('../models/Upload');
const { validateUploadPayload } = require('../middlewares/validation');
require('dotenv').config();

const DEFAULT_EXPIRY_MINUTES = parseInt(process.env.DEFAULT_EXPIRY_MINUTES, 10) || 10;

/**
 * POST /api/uploads
 * Body (multipart/form-data):
 *   type          – "text" | "file"
 *   textContent   – required if type=text
 *   file          – required if type=file  (multer field name: "file")
 *   password      – optional link password
 *   isOneTime     – "true" | "false"
 *   maxViews      – positive integer or empty
 *   expiresAt     – ISO 8601 datetime or empty (defaults to now + 10 min)
 */
exports.createUpload = (req, res) => {
  try {
    const { type, textContent, password, isOneTime, maxViews, expiresAt } = req.body;
    const file = req.file;

    // Validate
    const check = validateUploadPayload(req.body, file);
    if (!check.valid) return res.status(400).json({ error: check.error });

    // Compute expiry
    let expiry;
    if (expiresAt) {
      expiry = new Date(expiresAt).toISOString().replace('T', ' ').slice(0, 19);
    } else {
      const d = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000);
      expiry = d.toISOString().replace('T', ' ').slice(0, 19);
    }

    const slug = Upload.generateSlug();

    // Parse visibility & allowed users
    const visibility = req.body.visibility || 'public';
    if (!['public', 'private', 'protected'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility. Must be public, private, or protected.' });
    }
    if ((visibility === 'private' || visibility === 'protected') && !req.user) {
      return res.status(401).json({ error: 'Authentication required for private/protected vaults.' });
    }
    let allowedUserIds = [];
    if (visibility === 'protected' && req.body.allowedUserIds) {
      try {
        allowedUserIds = typeof req.body.allowedUserIds === 'string'
          ? JSON.parse(req.body.allowedUserIds)
          : req.body.allowedUserIds;
      } catch {
        return res.status(400).json({ error: 'Invalid allowedUserIds format.' });
      }
    }

    const record = Upload.create({
      slug,
      userId: req.user ? req.user.id : null,
      type,
      textContent: type === 'text' ? textContent : null,
      originalFilename: file ? file.originalname : null,
      storedFilename: file ? file.filename : null,
      mimeType: file ? file.mimetype : null,
      fileSize: file ? file.size : null,
      password: password || null,
      isOneTime: isOneTime === 'true' || isOneTime === true,
      maxViews: maxViews ? parseInt(maxViews, 10) : null,
      expiresAt: expiry,
      visibility,
      allowedUserIds,
    });

    return res.status(201).json({
      message: 'Upload created.',
      upload: {
        slug: record.slug,
        type: record.type,
        expiresAt: record.expires_at,
        isOneTime: !!record.is_one_time,
        maxViews: record.max_views,
        hasPassword: !!record.password_hash,
        visibility: record.visibility,
        url: `${req.protocol}://${req.get('host')}/api/link/${record.slug}`,
      },
    });
  } catch (err) {
    console.error('Create upload error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/uploads   (authenticated – user's own uploads)
 */
exports.listMyUploads = (req, res) => {
  try {
    const uploads = Upload.findByUserId(req.user.id).map((u) => ({
      id: u.id,
      slug: u.slug,
      type: u.type,
      originalFilename: u.original_filename,
      textPreview: u.text_content ? u.text_content.slice(0, 120) : null,
      isOneTime: !!u.is_one_time,
      maxViews: u.max_views,
      viewCount: u.view_count,
      expiresAt: u.expires_at,
      createdAt: u.created_at,
      hasPassword: !!u.password_hash,
      fileSize: u.file_size,
      mimeType: u.mime_type,
      visibility: u.visibility,
      allowedUsers: u.visibility === 'protected' ? Upload.getAllowedUsers(u.id) : [],
    }));

    return res.json({ uploads });
  } catch (err) {
    console.error('List uploads error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * DELETE /api/uploads/:id   (authenticated – owner only)
 */
exports.deleteUpload = (req, res) => {
  try {
    const upload = Upload.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: 'Upload not found.' });
    if (upload.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this upload.' });
    }

    // Remove file from disk if relevant
    if (upload.stored_filename) {
      const path = require('path');
      const fs = require('fs');
      const filepath = path.join(
        path.resolve(process.env.UPLOAD_DIR || './uploads'),
        upload.stored_filename
      );
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }

    Upload.softDelete(upload.id);
    return res.json({ message: 'Upload deleted.' });
  } catch (err) {
    console.error('Delete upload error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
