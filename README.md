# 🏥 MedBrief

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://med-brief-4hin.vercel.app/)

A full-stack AI-powered healthcare platform that lets patients upload medical reports, get structured health insights, chat with an AI health assistant, and connect with doctors — who can review history and issue prescriptions, all in one place.

> Built to scale. Not a toy. Not a tutorial clone.

## 🚀 Features

- **PDF/image report upload & extraction** — parses unstructured lab reports and pulls out structured biomarker data (e.g. LDL, HDL, HbA1c, eGFR, SpO2, Blood Glucose)
- **AI health assistant (Gemini)** — chat interface that answers questions about a patient's own medical records, prescriptions, and biomarker trends
- **Doctor–patient connection** — patients can connect with doctors, who can view relevant history and respond
- **Prescription upload & management** — doctors issue prescriptions directly through the platform, viewable on the patient side
- **JWT-based authentication** — secure signup/login with role awareness (doctor vs. patient)
- **Dashboard** — patient-facing view of reports, appointments, and chat in one place

## 🛠 Tech Stack

**Frontend**
- React (Vite)
- TypeScript

**Backend**
- FastAPI
- PostgreSQL
- JWT auth (plain REST — no WebSockets yet, see Roadmap)

**AI / Processing**
- PDF parsing & OCR (pdfplumber) for biomarker extraction
- Gemini AI for chat-based health insights

## 📁 Project Structure

```
MedBrief/
├── Frontend/
│   ├── src/
│   └── public/
├── backend/
│   ├── (FastAPI app, routers, models)
└── README.md
```

## ⚙️ Setup Instructions

**Backend**
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```
cd Frontend
npm install
npm run dev
```

⚠️ Never commit `.env` files to GitHub.

## 📌 Status

This is an actively developed, deployed project with early users testing the core flow: report upload → extraction → AI chat → doctor connection → prescription. Not all endpoints below are finalized as the API surface is still evolving.

## 🗺 Roadmap

Planned, not yet built:
- Real-time messaging (WebSockets)
- AI-based health risk prediction (custom-trained model vs. current Gemini-based summaries)
- Cloud storage integration
- Rate limiting & audit logging on sensitive endpoints

## ⚠️ Disclaimer

This application is not a medical diagnosis tool. It is intended for educational and informational purposes only.

## License

MIT License
