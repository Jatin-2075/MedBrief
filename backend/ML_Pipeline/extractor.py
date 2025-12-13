import os
import re
import json
import pandas as pd
from PyPDF2 import PdfReader
from docx import Document

# =========================================================
# Feature columns (MUST match training exactly)
# =========================================================
FEATURE_COLUMNS = [
    "PatientID","Age","Gender","BloodGroup","SystolicBP","DiastolicBP",
    "HeartRate","RespiratoryRate","BodyTemperature","SpO2",
    "FastingSugar","RandomSugar","Glucose","Hemoglobin","WBC_Count",
    "RBC_Count","Platelet_Count","BMI","CholesterolTotal","LDL","HDL",
    "Triglycerides","Urea","Creatinine"
]

# =========================================================
# Parsing configuration
# =========================================================
CATEGORICAL_FIELDS = {"PatientID", "Gender", "BloodGroup"}

BG_STRICT_RE = re.compile(r"\b(?:A|B|AB|O)[\s]*[+-]\b", re.IGNORECASE)
BG_RELAXED_RE = re.compile(r"\b(?:A|B|AB|O)[\s]*[+-]?\b", re.IGNORECASE)

FIELD_LABELS = {
    "PatientID": ["PatientID", "Patient ID", "ID"],
    "Age": ["Age", "Patient Age"],
    "Gender": ["Gender", "Sex"],
    "BloodGroup": ["Blood Group", "BloodGroup", "Bld Group"],

    "SystolicBP": ["Blood Pressure", "BP", "Systolic BP"],
    "DiastolicBP": ["Blood Pressure", "BP", "Diastolic BP"],

    "HeartRate": ["Heart Rate", "Pulse"],
    "RespiratoryRate": ["Respiratory Rate", "RR"],
    "BodyTemperature": ["Body Temperature", "Temperature", "Temp"],
    "SpO2": ["SpO2", "Oxygen Saturation"],

    "FastingSugar": ["Fasting Sugar", "FBS"],
    "RandomSugar": ["Random Sugar", "RBS"],
    "Glucose": ["Glucose"],

    "Hemoglobin": ["Hemoglobin", "Hb"],
    "WBC_Count": ["WBC Count"],
    "RBC_Count": ["RBC Count"],
    "Platelet_Count": ["Platelet Count"],

    "BMI": ["BMI"],
    "CholesterolTotal": ["Total Cholesterol"],
    "LDL": ["LDL"],
    "HDL": ["HDL"],
    "Triglycerides": ["Triglycerides", "TG"],
    "Urea": ["Urea"],
    "Creatinine": ["Creatinine"],
}

# =========================================================
# Regex helpers
# =========================================================
LABEL_TO_FIELD = {}
ALL_LABELS = []

for field, labels in FIELD_LABELS.items():
    for lbl in labels:
        LABEL_TO_FIELD[lbl.lower()] = field
        ALL_LABELS.append(re.escape(lbl))

LABEL_PATTERN = re.compile(
    r"\b(" + "|".join(sorted(ALL_LABELS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE
)

NUM_RE = re.compile(r"(\d+(?:\.\d+)?)")
PAIR_RE = re.compile(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)")

# =========================================================
# Text extraction
# =========================================================
def extract_text(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)

    ext = file_path.lower().split(".")[-1]

    if ext == "pdf":
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == "docx":
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)

    raise ValueError("Unsupported file type (PDF/DOCX only)")

# =========================================================
# Core parsing logic (UNCHANGED, VERIFIED)
# =========================================================
def generalized_parse_report_text(text: str) -> dict:
    data = {}
    if not text:
        return data

    matches = list(LABEL_PATTERN.finditer(text))
    text_len = len(text)

    for idx, match in enumerate(matches):
        label = match.group(0).lower()
        field = LABEL_TO_FIELD.get(label)

        if not field or field in data:
            continue

        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else text_len
        snippet = text[start:end].strip()

        # categorical fields
        if field in CATEGORICAL_FIELDS:
            if field == "BloodGroup":
                bg = BG_STRICT_RE.search(snippet) or BG_RELAXED_RE.search(snippet)
                if bg:
                    data[field] = bg.group(0).replace(" ", "").upper()
            else:
                token = re.search(r"[A-Za-z][A-Za-z0-9/_+-]{0,20}", snippet)
                if token:
                    data[field] = token.group(0)
            continue

        # BP special case
        if "bp" in label:
            pair = PAIR_RE.search(snippet)
            if pair:
                data["SystolicBP"], data["DiastolicBP"] = pair.groups()
            continue

        num = NUM_RE.search(snippet)
        if num:
            data[field] = num.group(1)

    # Normalize gender
    if "Gender" in data:
        g = data["Gender"].lower()
        data["Gender"] = "Male" if g.startswith("m") else "Female" if g.startswith("f") else data["Gender"]

    return data

# =========================================================
# CSV writer (pipeline entry point)
# =========================================================
def create_temp_csv_from_report(report_file: str, temp_csv: str) -> None:
    text = extract_text(report_file)
    parsed = generalized_parse_report_text(text)

    row = {col: str(parsed.get(col, "")) for col in FEATURE_COLUMNS}
    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    df.to_csv(temp_csv, index=False)
