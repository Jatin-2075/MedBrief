# MedBrief AI

MedBrief AI is a health assistant platform that combines patient profile management, medicine tracking, medical report summarization, and AI-powered health insights. It includes a Python backend for authentication, medical data processing, and AI services, plus a TypeScript/Vite frontend for managing health records, appointments, prescriptions, chat, and reports.

## What this project does
- Enables patients to store and manage their personal health profile and vitals
- Supports medicine cataloging, prescriptions, and medication tracking
- Accepts medical data from PDF extraction and clinical reports
- Uses AI to analyze health data and summarize findings
- Provides a UI for appointments, profiles, reports, prescriptions, and AI chat

## Key features
- User authentication and role-based access
- Patient profile and health data storage
- Prescription and medicine management
- Appointment scheduling support
- AI-assisted health report analysis
- Frontend dashboard and chat experience

## Environment example
Create an `.env` file for each service and do not commit it to Git.

Example values:

```env
# Backend settings
DATABASE_URL=postgresql://user:password@localhost:5432/medbrief
SECRET_KEY=supersecretkey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

> Do not add real credentials to version control.

## Getting started
1. Install backend dependencies:
   - `pip install -r Backend/requirements.txt`
2. Install frontend dependencies:
   - `cd Frontend && npm install`
3. Run the backend and frontend services separately.

## Notes
- The repository uses separate frontend and backend folders.
- The `.env` files are ignored for both backend and frontend environments.