NORMAL_RANGES = {

    # -----------------
    # VITAL SIGNS
    # -----------------
    "blood_pressure": {
        "type": "bp",
        "systolic_max": 120,
        "diastolic_max": 80,
        "unit": "mmHg",
    },
    "heart_rate": {
        "type": "numeric",
        "min": 60,
        "max": 100,
        "unit": "bpm",
    },
    "respiratory_rate": {
        "type": "numeric",
        "min": 12,
        "max": 20,
        "unit": "breaths/min",
    },
    "body_temperature": {
        "type": "numeric",
        "min": 36.1,
        "max": 37.2,
        "unit": "°C",
    },
    "spo2": {
        "type": "numeric",
        "min": 95,
        "max": 100,
        "unit": "%",
    },

    # -----------------
    # BLOOD SUGAR
    # -----------------
    "fasting_glucose": {
        "type": "numeric",
        "min": 70,
        "max": 99,
        "unit": "mg/dL",
    },
    "random_glucose": {
        "type": "numeric",
        "min": 0,            # explicit lower bound
        "max": 140,
        "unit": "mg/dL",
    },

    # -----------------
    # BLOOD COUNTS
    # -----------------
    "hemoglobin": {
        "type": "gender_based",
        "male": {"min": 13, "max": 17},
        "female": {"min": 12, "max": 15},

        # Fallback (used if gender unknown)
        "min": 12,
        "max": 17,

        "unit": "g/dL",
    },
    "platelet_count": {
        "type": "numeric",
        "min": 150000,
        "max": 450000,
        "unit": "/µL",
    },

    # -----------------
    # BIOCHEMISTRY
    # -----------------
    "blood_urea": {
        "type": "numeric",
        "min": 15,
        "max": 40,
        "unit": "mg/dL",
    },
    "serum_creatinine": {
        "type": "numeric",
        "min": 0.6,
        "max": 1.3,
        "unit": "mg/dL",
    },
    "total_cholesterol": {
        "type": "numeric",
        "max": 200,
        "unit": "mg/dL",
    },

    # -----------------
    # BODY METRICS
    # -----------------
    "bmi": {
        "type": "numeric",
        "min": 18.5,
        "max": 24.9,
        "unit": "",
    },

    # -----------------
    # QUALITATIVE TESTS
    # -----------------
    "urine_sugar": {
        "type": "qualitative",
        "normal": ["absent", "negative"],
    },
    "hiv": {
        "type": "qualitative",
        "normal": ["non reactive", "negative"],
    },
    "hbsag": {
        "type": "qualitative",
        "normal": ["non reactive", "negative"],
    },
    "vdrl": {
        "type": "qualitative",
        "normal": ["non reactive", "negative"],
    },
}
