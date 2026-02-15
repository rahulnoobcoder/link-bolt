const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/upload');
const { requireAuth, optionalAuth } = require('../middlewares/auth');

// Create upload – anonymous or authenticated
router.post('/', optionalAuth, upload.single('file'), (req, res, next) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  next();
}, uploadController.createUpload);

// List my uploads – requires auth
router.get('/', requireAuth, uploadController.listMyUploads);

// Delete own upload – requires auth
router.delete('/:id', requireAuth, uploadController.deleteUpload);

module.exports = router;
