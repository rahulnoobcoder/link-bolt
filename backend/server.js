require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// ── Initialise database (runs CREATE TABLE IF NOT EXISTS on import) ─────
require('./config/db');

// ── Import routes ───────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const linkRoutes = require('./routes/linkRoutes');

// ── Import cron job ─────────────────────────────────────────────────────
const { startCleanupJob } = require('./jobs/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ───────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', apiLimiter);

// ── API routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/link', linkRoutes);

// ── Multer error handler ────────────────────────────────────────────────
app.use((err, _req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 50 MB.' });
  }
  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// ── Generic error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🔗  LinkVault API running on http://localhost:${PORT}\n`);
  startCleanupJob();
});
