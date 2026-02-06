const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron'); // Optimization: Background jobs
const crypto = require('crypto'); // Optimization: Secure IDs

// --- FIREBASE SETUP (Uncomment to use Firebase) ---
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'YOUR_PROJECT_ID.appspot.com'
});
const bucket = admin.storage().bucket();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database Setup
const db = new sqlite3.Database('./linkvault.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    type TEXT,
    content TEXT,
    filename TEXT,
    filepath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME
  )`);
});

// Helper: Generate Secure ID
const generateId = () => crypto.randomBytes(4).toString('hex');

// Storage Configuration (Local Fallback)
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// --- OPTIMIZATION: Background Cleanup Job (Runs every hour) ---
cron.schedule('0 * * * *', () => {
  console.log('Running expiration cleanup task...');
  const now = Date.now();
  
  db.all("SELECT * FROM links WHERE expiresAt < ?", [now], (err, rows) => {
    if (err) return;
    
    rows.forEach(row => {
      // 1. Delete from DB
      db.run("DELETE FROM links WHERE id = ?", [row.id]);
      
      // 2. Delete file (Local or Firebase)
      if (row.type === 'file' && row.filepath) {
        // Local deletion
        if (fs.existsSync(row.filepath)) fs.unlinkSync(row.filepath);
        
        // Firebase deletion (Uncomment if using Firebase)
        // bucket.file(row.filename).delete().catch(e => console.log(e));
      }
    });
  });
});

// Routes
app.post('/upload', upload.single('file'), async (req, res) => {
  const { type, content, expiration } = req.body;
  const id = generateId();
  // Default to 24h if not specified
  const expiresAt = Date.now() + (parseInt(expiration) || 24) * 60 * 60 * 1000; 

  let filename = null;
  let filepath = null;

  if (type === 'file' && req.file) {
    filename = req.file.filename;
    filepath = req.file.path; // Store local path or Firebase URL
    
    // IF USING FIREBASE: Upload req.file to bucket here and set filepath to public URL
  }

  db.run(
    `INSERT INTO links (id, type, content, filename, filepath, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, type, content, filename, filepath, expiresAt],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ link: `http://localhost:5173/${id}`, expiresAt });
    }
  );
});

app.get('/:id', (req, res) => {
  const id = req.params.id;
  const now = Date.now();

  db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Link not found or expired' });

    if (row.expiresAt < now) {
      // Lazy delete triggered (backup to cron)
      db.run("DELETE FROM links WHERE id = ?", [id]);
      if (row.type === 'file' && fs.existsSync(row.filepath)) fs.unlinkSync(row.filepath);
      return res.status(410).json({ error: 'Link expired' });
    }

    res.json(row);
  });
});

app.get('/download/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
        if (err || !row || row.type !== 'file') return res.status(404).send("File not found");
        res.download(row.filepath, row.filename);
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});