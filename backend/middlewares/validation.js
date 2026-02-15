/**
 * Shared validation helpers used by controllers.
 */

/**
 * Validate upload creation payload.
 * Returns { valid: true } or { valid: false, error: string }.
 */
function validateUploadPayload(body, file) {
  const { type, textContent } = body;

  if (!type || !['text', 'file'].includes(type)) {
    return { valid: false, error: 'Invalid upload type. Must be "text" or "file".' };
  }

  if (type === 'text') {
    if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
      return { valid: false, error: 'Text content is required for text uploads.' };
    }
    if (textContent.length > 500_000) {
      return { valid: false, error: 'Text content exceeds the 500 000 character limit.' };
    }
  }

  if (type === 'file' && !file) {
    return { valid: false, error: 'A file is required for file uploads.' };
  }

  // Validate optional expiry
  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (isNaN(d.getTime())) {
      return { valid: false, error: 'Invalid expiry date format.' };
    }
    if (d <= new Date()) {
      return { valid: false, error: 'Expiry date must be in the future.' };
    }
  }

  // Validate optional maxViews
  if (body.maxViews !== undefined && body.maxViews !== null && body.maxViews !== '') {
    const n = Number(body.maxViews);
    if (!Number.isInteger(n) || n < 1) {
      return { valid: false, error: 'maxViews must be a positive integer.' };
    }
  }

  // Validate visibility
  if (body.visibility && !['public', 'private', 'protected'].includes(body.visibility)) {
    return { valid: false, error: 'Invalid visibility. Must be public, private, or protected.' };
  }

  return { valid: true };
}

/**
 * Validate registration payload.
 */
function validateRegister({ username, password }) {
  if (!username || username.trim().length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }
  if (username.trim().length > 24) {
    return { valid: false, error: 'Username must be 24 characters or fewer.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return { valid: false, error: 'Username may only contain letters, numbers and underscores.' };
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }
  return { valid: true };
}

module.exports = { validateUploadPayload, validateRegister };
