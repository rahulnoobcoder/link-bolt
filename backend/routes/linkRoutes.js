const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { optionalAuth } = require('../middlewares/auth');

// Get metadata about a link (no view-count increment)
router.get('/:slug/meta', optionalAuth, linkController.getLinkMeta);

// Access full content (increments view count, may require password in body)
router.post('/:slug', optionalAuth, linkController.accessLink);

// Direct file download
router.get('/:slug/download', optionalAuth, linkController.downloadFile);

module.exports = router;
