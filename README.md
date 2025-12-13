### 404 Not Found ###

Frontend/
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── UploadCard.jsx
│   │   ├── Loader.jsx
│   │   └── Alert.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── UploadData.jsx    # Upload CSV / enter vitals
│   │   ├── Dashboard.jsx     # Health stats & analysis
│   │   ├── Smart_help.jsx    # Chatbot
│   │   ├── Reports.jsx       # History / reports
│   │   └── Help.jsx          # To get help
│   │
│   ├── services/
│   │   └── api.js            # Backend (FastAPI) calls
│   │
│   ├── hooks/
│   │   └── useHealthData.js
│   │
│   ├── utils/
│   │   ├── validators.js     # Input validation
│   │   └── formatters.js     # Units, numbers, text
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── dashboard.css
│   │   └── theme.css
│   │
│   ├── App.jsx
│   ├── routes.jsx
│   └── main.jsx
│
├── .gitignore
├── package.json
├── vite.config.js
└── README.md


backend/
│
├── manage.py
├── db.sqlite3
│
├── backend/                     # Django project
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── APIAUTH/                     # Django app
│   ├── models.py                # MedicalReport model
│   ├── views.py                 # API endpoints
│   ├── serializers.py           # optional
│   └── urls.py
│
├── ML_Pipeline/
│   ├── __init__.py
│   │
│   ├── extractor.py             # (extract_to_temp.py logic)
│   ├── inference.py             # (infer_and_pdf.py logic)
│   ├── pipeline.py              # 🔥 ORCHESTRATOR (new)
│   │
│   ├── artifacts/
│   │   ├── imputer.pkl
│   │   ├── cat_encoders.pkl
│   │   ├── training_columns.pkl
│   │   ├── ensemble_3models.pkl
│   │   └── label_encoder.pkl
│   │
│   └── temp/                    # runtime files (per request)
│       └── <uuid>/
│           ├── input.pdf
│           ├── Temp.csv
│           ├── Test.csv
│           └── Final.pdf
│
└── media/
    ├── reports/
    │   ├── originals/
    │   └── summaries/
