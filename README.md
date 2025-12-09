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
