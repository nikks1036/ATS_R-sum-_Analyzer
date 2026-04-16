# ATS Resume Analyzer

A full-stack web application that helps users evaluate how well their resume matches a job description using ATS-style keyword scoring and AI-powered improvement suggestions.

## Highlights

- User authentication (register, login, protected routes)
- PDF resume upload and text extraction
- ATS compatibility score based on resume vs job-description keywords
- AI suggestions for:
- Missing skills
- Resume bullet improvements
- Interview preparation tips
- Concrete edits to apply
- Persistent local storage using SQLite

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Database: SQLite (`sqlite3`)
- AI: Google Gemini API
- File Upload: Multer

## Project Structure

```text
ATS-Resume_Analyzer/
|-- backend/
|   `-- backend/
|       |-- controllers/
|       |-- routes/
|       |-- models/
|       |-- utils/
|       |-- db/
|       |-- .env
|       |-- package.json
|       `-- server.js
`-- frontend/
    |-- src/
    |-- package.json
    `-- vite.config.js
```

## Prerequisites

- Node.js 18+
- npm 9+
- Internet access for Gemini API calls

## Environment Setup (Backend)

Create or update:

`backend/backend/.env`

```env
PORT=5000
SQLITE_PATH=./data/resume-analyzer.sqlite
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Important:
- Keep `.env` private and never commit real secrets.
- Replace `GEMINI_API_KEY` with your own valid key.

## Run Locally (Backend First, Then Frontend)

### 1. Start Backend

```powershell
cd d:\ATS-Resume_Analyzer\backend\backend
npm install
npm start
```

Backend runs on:

`http://localhost:5000`

### 2. Start Frontend (new terminal)

```powershell
cd d:\ATS-Resume_Analyzer\frontend
npm install
npm run dev
```

Frontend runs on:

`http://localhost:5173` (default Vite URL)

## How to Use

1. Open the frontend in your browser.
2. Register a new account (or login).
3. Go to **Your Resumes**.
4. Upload a PDF resume.
5. Paste a full job description (minimum 20 words).
6. Click **Upload & Analyze**.
7. Review ATS score and generated recommendations.

## API Endpoints

Base URL: `http://localhost:5000`

- `POST /auth/register` - Create user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user (protected)
- `POST /resume/upload` - Upload resume PDF (protected, field name: `resume`)
- `POST /resume/analyze` - Analyze resume against job description (protected)

## Troubleshooting

- `Unable to reach server`:
- Ensure backend is running on port `5000`.
- `Invalid credentials`:
- Check login email/password and confirm user is registered.
- `Job description is too short`:
- Provide at least 20 words in the job description.
- Gemini errors:
- Verify `GEMINI_API_KEY` is valid and active.
- Port already in use:
- Change `PORT` in backend `.env` and restart.

## Future Improvements

- Password hashing with `bcryptjs`
- Refresh tokens and secure session handling
- Better validation and rate limiting
- Upload history and downloadable reports
- Docker setup for one-command startup

## License

This project is for educational and portfolio use. Add a license (MIT recommended) if you plan to publish publicly.
