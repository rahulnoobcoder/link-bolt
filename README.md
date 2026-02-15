# LinkVault

LinkVault is a secure, ephemeral file and text sharing application inspired by Pastebin and Google Drive. It allows users to upload content (text or files) and generate unique, shareable links with advanced privacy controls like password protection, one-time viewing, and automatic expiry.

## 🚀 Technlogy Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Framer Motion (Animations)
- React Router DOM
- Axios

**Backend**
- Node.js + Express
- SQLite (via `better-sqlite3` in WAL mode)
- JWT Authentication
- Multer (File handling)
- Node-cron (Cleanup jobs)

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd LinkVault

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configuration
Create a `.env` file in the `backend/` directory (optional, defaults provided in code):
```
PORT=5000
JWT_SECRET=your_super_secret_key_here
UPLOAD_DIR=./uploads
DB_PATH=./data/linkvault.db
```

### 3. Running the Application
You need to run both the backend and frontend servers.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Client starts on http://localhost:5173
```

---

## 📡 API Overview

### Authentication
- `POST /api/auth/register` - Create account (username + password)
- `POST /api/auth/login` - Authenticate and get JWT

### Uploads
- `POST /api/uploads` - Create new upload (Multipart/form-data)
    - Accepts: `file` OR `textContent`, `password`, `expiresAt`, `maxViews`, `isOneTime`, `visibility`
- `GET /api/uploads` - List user's uploads
- `DELETE /api/uploads/:id` - Delete an upload

### Public Access
- `GET /api/link/:slug/meta` - Get public metadata (check if password required)
- `POST /api/link/:slug` - Access content (provide password if needed)
- `GET /api/link/:slug/download` - Download file stream

---

## 💡 Design Decisions

1. **SQLite (WAL Mode)**: chosen for zero-configuration setup and reliability. Write-Ahead Logging (WAL) is enabled for better concurrency.
2. **File Storage**: Large files are stored on the **filesystem**, not the database, to keep the DB lean and performant. Only metadata and small text pastes live in SQLite.
3. **User-Centric Auth**: We switched from Email/Password to **Username/Password** to prioritize anonymity and ease of use, fitting the "burner link" use case.
4. **Cleanup Strategy**: A specific `node-cron` job runs every minute to hard-delete expired records and remove their corresponding files from disk, ensuring the server storage doesn't grow indefinitely.
5. **Security**:
   - Passwords for links are hashed (bcrypt), never stored plainly.
   - Filenames are randomized (`nanoid`) on disk to prevent overwrites and directory traversal attacks.

## ⚠️ Assumptions & Limitations

- **File Storage**: Currently uses local disk storage. In a distributed cloud environment (like Vercel/Heroku), this would need to be swapped for S3/Blob Storage since local files are ephemeral.
- **Scalability**: SQLite is excellent for this scale but requires vertical scaling. For millions of concurrent users, migrating to PostgreSQL would be recommended.
- **Rate Limiting**: Basic rate limiting is implemented to prevent abuse, but strict IP-based blocking is minimal.
