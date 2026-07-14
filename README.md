# 🏥 MedBrief

**An AI-powered healthcare platform connecting patients and doctors — lab report analysis, prescription tracking, appointment scheduling, and real-time messaging in one system.**

> Built to scale. Not a toy. Not a tutorial clone.

---

## 🚀 Features

- **JWT authentication** with access + refresh token rotation and role-based access (patient / doctor)
- **AI-powered lab report analysis** — upload a PDF report, extract biomarkers via OCR/text parsing, and get an AI-generated health summary (cardiac risk, metabolic status, kidney function) via Google Gemini
- **Prescription management** — doctors issue and track active/historical prescriptions per patient
- **Appointment scheduling** between doctors and patients
- **Real-time 1:1 messaging** between doctor and patient over WebSockets, backed by persisted conversation history
- **AI health assistant chat** — a separate Gemini-powered conversational assistant with session history
- **Audit logging** for tracking access to patient data
- **Doctor–patient relationship model** — doctors manage a roster of patient profiles

## 🛠 Tech Stack

**Backend**
- FastAPI (Python), Uvicorn ASGI server
- PostgreSQL + SQLAlchemy ORM, Alembic migrations
- JWT auth (python-jose) with bcrypt password hashing
- WebSockets for real-time chat
- Google Gemini (`google-genai`) for AI report analysis and the chat assistant
- PDF/OCR pipeline: `pdfplumber`, `pdfminer.six`, `pdf2image`, `pytesseract`, `pypdfium2`

**Frontend**
- React 19 + Vite
- React Router
- Tailwind CSS
- Recharts (health data visualizations)
- Motion (animations)

## 📁 Project Structure

```
MedBrief/
├── backend/
│   ├── Router/          # API route handlers (Auth, Personal, Medical, Medicine, System, Messaging)
│   ├── Models/           # SQLAlchemy models
│   ├── Schemas/          # Pydantic request/response schemas
│   ├── Services/         # Business logic (e.g. WebSocket connection manager)
│   ├── Security/         # Auth dependencies, settings, JWT handling
│   ├── DataBase/         # DB session/engine setup
│   ├── Core/              # Core utilities (AI pipeline, OCR extraction, etc.)
│   ├── alembic/           # Database migrations
│   ├── Main.py            # FastAPI app entrypoint
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── Components/
│   │   ├── pages/
│   │   ├── Context/
│   │   └── Config/
│   └── package.json
└── README.md
```

## 🔐 Environment Variables

**Backend** (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/medbrief
SECRET_KEY=your-generated-secret-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.0-flash
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
ALLOWED_HOSTS=http://localhost:5173
```

**Frontend** (`Frontend/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

⚠️ Never commit `.env` files to GitHub.

## ⚙️ Setup Instructions

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
alembic upgrade head
python -m uvicorn Main:app --reload
```

Server runs on `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`.

**Frontend**

```bash
cd Frontend
npm install
npm run dev
```

## 📌 API Overview

| Router | Prefix | Purpose |
|---|---|---|
| Auth | `/auth` | Signup, login, token refresh, current user |
| Personal Data | `/personal` | Doctor and patient profile management |
| Health Reports | `/reports` | Upload/retrieve lab reports and AI analysis |
| Prescriptions | `/prescriptions` | Prescribe and track medications |
| System | `/system` | Appointments, AI chat assistant |
| Messaging | `/messaging` | Doctor–patient conversations, WebSocket live chat |

Full endpoint-level documentation lives in [`backend/readme.md`](backend/readme.md), including the database schema.

## 🧠 Architecture Notes

- Real-time messaging currently uses an **in-memory WebSocket connection manager**, scoped to a single server process. It's designed to be swapped for a Redis pub/sub-backed manager for horizontal scaling without touching route logic.
- Health report analysis is a two-stage pipeline: OCR/text extraction pulls structured biomarkers from an uploaded PDF, then Gemini generates a structured risk summary from those values.

## 🔮 Future Improvements

- Redis pub/sub for horizontally-scalable WebSocket messaging
- AI-based disease risk prediction trends over time
- Cloud storage for uploaded reports (currently local disk)
- Mobile app version

## ⚠️ Disclaimer

This application is not a medical diagnosis tool. It is intended for educational and portfolio purposes only.
