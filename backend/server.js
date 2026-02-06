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

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)){
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
// Serve the 'uploads' folder publicly so the frontend can download files
app.use('/uploads', express.static(UPLOAD_DIR));

// --- DATABASE SETUP ---
// Delete old DB to prevent schema errors: rm linkvault.db (if it exists)
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

// --- LOCAL STORAGE SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Unique filename: id-originalname.pdf
    cb(null, `${nanoid(10)}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// --- CRON JOB (Auto-Delete) ---
cron.schedule('* * * * *', () => { // Runs every minute
  const now = Date.now();
  db.all("SELECT * FROM links WHERE expiresAt < ?", [now], (err, rows) => {
    if (err || !rows) return;

    rows.forEach((row) => {
      console.log(`🗑️ Expired: ${row.id}`);
      db.run("DELETE FROM links WHERE id = ?", [row.id]);

      if (row.type === 'file' && row.filepath) {
        // Construct absolute path to ensure deletion works
        const absolutePath = path.resolve(row.filepath);
        if (fs.existsSync(absolutePath)) {
            try {
                fs.unlinkSync(absolutePath);
                console.log(`   Deleted file: ${row.filename}`);
            } catch (e) {
                console.error(`   Error deleting: ${e.message}`);
            }
        }
      }
    });
  });
});

// --- ROUTES ---

// 1. Upload Route
app.post('/upload', upload.single('file'), (req, res) => {
  const { type, content } = req.body;
  const id = nanoid(8);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours

  let filename = null;
  let filepath = null;

  if (type === 'file' && req.file) {
    filename = req.file.originalname;
    filepath = req.file.path; 
  } else if (type === 'text' && !content) {
      return res.status(400).json({ error: "No content provided" });
  }

  const stmt = db.prepare("INSERT INTO links (id, type, content, filename, filepath, expiresAt) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, type, content, filename, filepath, expiresAt, function(err) {
    if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
    }
    res.json({ link: `http://localhost:5173/${id}`, expiresAt });
  });
  stmt.finalize();
});

// 2. View/Retrieve Route
app.get('/:id', (req, res) => {
  const id = req.params.id;
  const now = Date.now();

  db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Link not found' });
    if (row.expiresAt < now) return res.status(410).json({ error: 'Link expired' });
    res.json(row);
  });
});

// 3. Download Route
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