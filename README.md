**LinkVault**

LinkVault is a secure, ephemeral file and text sharing application inspired by Pastebin and Google Drive. It allows users to upload content (text or files) and generate unique, shareable links with advanced privacy controls like password protection, one-time viewing, and automatic expiry.

**Technology Stack**

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Axios

**Backend**
- Node.js + Express
- SQLite (WAL mode)
- JWT Authentication
- Multer
- Node-cron

**Setup Instructions**

**1. Clone & Install**
```bash
git clone https://github.com/rahulnoobcoder/Link-Bolt
cd LinkVault

# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

**2. Configuration**
Create a .env file in the backend/ directory:(compulsory)
```
PORT=5000
JWT_SECRET=YourSuperSecretKey
DB_PATH=./data/linkvault.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
DEFAULT_EXPIRY_MINUTES=10
FRONTEND_URL=http://localhost:5173

```

**3. Running the Application**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

**API Overview**

1. **Authentication:** Register and login endpoints.
2. **Uploads:** Create (multipart/form-data), list, and delete uploads.
3. **Public Access:** Retrieve metadata, access protected content, and download files via slugs.

**Design Decisions**

- **Database:** SQLite (WAL Mode) for reliability and zero-config setup.
- **Storage:** Metadata in DB; large files on disk to keep DB lean.
- **Auth:** Username/Password for anonymity.
- **Cleanup:** Background cron jobs delete expired files/records automatically.
- **Security:** Link passwords are hashed; filenames are randomized.

**Assumptions & Limitations**

- **Local Storage:** Files are stored locally (not suitable for serverless platforms like Vercel without S3).
- **Scalability:** SQLite is great for single-instance; PostgreSQL recommended for massive scale.
- **Rate Limiting:** Basic implementation included. 