const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cron = require('node-cron');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// --- DATABASE SETUP ---
const db = new sqlite3.Database('./linkvault.db', (err) => {
  if (err) console.error("DB Error:", err.message);
  console.log('✅ Connected to SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    type TEXT,
    content TEXT,
    filename TEXT,
    filepath TEXT,
    expiresAt INTEGER
  )`);
});

// --- STORAGE ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${nanoid(10)}-${file.originalname}`)
});
const upload = multer({ storage });

// --- CRON JOB: ROBUST CLEANUP ---
cron.schedule('* * * * *', () => {
  const now = Date.now();
  console.log(`[CRON] 🕒 Running cleanup check...`);

  // 1. Find expired links
  db.all("SELECT * FROM links WHERE expiresAt < ?", [now], (err, rows) => {
    if (err) return console.error("[CRON] DB Query Error:", err);
    
    if (rows.length === 0) {
      // Uncomment the line below if you want to see this every minute
      // console.log("[CRON] No expired items found.");
      return;
    }

    console.log(`[CRON] Found ${rows.length} expired items. Deleting...`);

    rows.forEach((row) => {
      // 2. Remove from Database first
      db.run("DELETE FROM links WHERE id = ?", [row.id], (dbErr) => {
        if (dbErr) {
            console.error(`[CRON] ❌ DB Delete failed for ID: ${row.id}`, dbErr);
        } else {
            console.log(`[CRON] ✅ Record deleted from DB: ${row.id}`);
        }
      });

      // 3. Remove File from Disk (if it's a file)
      if (row.type === 'file' && row.filepath) {
        try {
          // Fix path slashes for Windows/Linux compatibility
          const absolutePath = path.resolve(row.filepath); 
          
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`[CRON] 🗑️  File deleted successfully: ${row.filename}`);
          } else {
            console.warn(`[CRON] ⚠️  File listed in DB but not found on disk: ${row.filename}`);
            console.warn(`        Search Path: ${absolutePath}`);
          }
        } catch (fileErr) {
          console.error(`[CRON] ❌ File deletion error: ${fileErr.message}`);
        }
      }
    });
  });
});

// --- ROUTES ---

// Upload
app.post('/upload', upload.single('file'), (req, res) => {
  const { type, content, expiration } = req.body; 
  const id = nanoid(8);
  
  // Calculate Expiration: Uses the custom minutes sent from frontend
  const ttlMinutes = parseInt(expiration) || 60; 
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

  let filename = null;
  let filepath = null;

  if (type === 'file' && req.file) {
    filename = req.file.originalname;
    filepath = req.file.path; 
  } else if (type === 'text' && !content) {
      return res.status(400).json({ error: "No content provided" });
  }

  const stmt = db.prepare("INSERT INTO links VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, type, content, filename, filepath, expiresAt, function(err) {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ link: `http://localhost:5173/${id}`, expiresAt });
  });
  stmt.finalize();
});

// View
app.get('/:id', (req, res) => {
  const id = req.params.id;
  const now = Date.now();
  db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Link not found' });
    if (row.expiresAt < now) return res.status(410).json({ error: 'Link expired' });
    res.json(row);
  });
});

// Download
app.get('/download/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
        if (err || !row || row.type !== 'file') return res.status(404).send("File not found");
        res.download(row.filepath, row.filename);
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});