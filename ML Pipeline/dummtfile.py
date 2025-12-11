import os
from PyPDF2 import PdfReader
from docx import Document
import os
import re
import csv
import pandas as pd
from PyPDF2 import PdfReader
from docx import Document

# 1. Fixed feature columns (no target here)
FEATURE_COLUMNS = [
    "PatientID","Age","Gender","BloodGroup",
    "SystolicBP","DiastolicBP","HeartRate","RespiratoryRate",
    "BodyTemperature","SpO2","FastingSugar","RandomSugar",
    "Glucose","Hemoglobin","WBC_Count","RBC_Count",
    "Platelet_Count","BMI","CholesterolTotal","LDL","HDL",
    "Triglycerides","Urea","Creatinine"
]

# 2. Your target column name (CHANGE THIS to your real label name)
TARGET_COLUMN = "FinalDiagnosis"   # e.g. "DiseaseRisk", "Label", etc.



def extract_text(file_path):
    """
    Extract text from a PDF or DOCX file.
    
    Args:
        file_path (str): Path to file (.pdf or .docx)

    Returns:
        str: Extracted text
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError("File does not exist.")

    ext = file_path.lower().split('.')[-1]

    # ----- PDF Extraction -----
    if ext == "pdf":
        text = ""
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    # ----- DOCX Extraction -----
    elif ext == "docx":
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    else:
        raise ValueError("Unsupported file type. Use PDF or DOCX.")

FIELD_LABELS = {
    "PatientID": ["PatientID", "Patient ID", "ID"],
    "Age": ["Age"],
    "Gender": ["Gender", "Sex"],
    "BloodGroup": ["Blood Group", "BloodGroup", "Blood group", "Bld Group"],

    "SystolicBP": ["Systolic BP", "SystolicBP"],
    "DiastolicBP": ["Diastolic BP", "DiastolicBP"],

    "HeartRate": ["Heart Rate", "HeartRate", "Pulse"],
    "RespiratoryRate": ["Respiratory Rate", "RespiratoryRate", "RR"],
    "BodyTemperature": ["Body Temperature", "Temperature", "Temp"],
    "SpO2": ["SpO2", "Oxygen Saturation"],

    "FastingSugar": ["Fasting Sugar", "FBS", "Fasting Glucose"],
    "RandomSugar": ["Random Sugar", "RBS", "Random Glucose"],
    "Glucose": ["Glucose"],

    "Hemoglobin": ["Hemoglobin", "Hb"],
    "WBC_Count": ["WBC Count", "WBC"],
    "RBC_Count": ["RBC Count", "RBC"],
    "Platelet_Count": ["Platelet Count", "Platelets"],

    "BMI": ["BMI"],
    "CholesterolTotal": ["Total Cholesterol", "Cholesterol Total", "Cholesterol"],
    "LDL": ["LDL"],
    "HDL": ["HDL"],
    "Triglycerides": ["Triglycerides", "TG"],
    "Urea": ["Urea"],
    "Creatinine": ["Creatinine"],
}

def find_first_match(pattern, text, flags=re.IGNORECASE):
    m = re.search(pattern, text, flags)
    if m:
        return m.group(1).strip()
    return None

def parse_report_text(text):
    data = {}

    # Generic extraction
    for field, labels in FIELD_LABELS.items():
        if field in ("SystolicBP", "DiastolicBP"):
            continue
        for label in labels:
            pattern = rf"{re.escape(label)}\s*[:=\-]\s*([A-Za-z0-9.+/ %]+)"
            value = find_first_match(pattern, text)
            if value is not None:
                data[field] = value
                break

    # Gender normalization
    if "Gender" in data:
        g = data["Gender"].lower()
        if g.startswith("m"):
            data["Gender"] = "Male"
        elif g.startswith("f"):
            data["Gender"] = "Female"

    # Blood group cleanup
    if "BloodGroup" in data:
        bg = data["BloodGroup"].upper().replace(" ", "")
        m_bg = re.search(r"\b(A|B|AB|O)[+-]\b", bg)
        if m_bg:
            data["BloodGroup"] = m_bg.group(0)
        else:
            data["BloodGroup"] = bg

    # BP as "BP: 120/80"
    bp_match = re.search(r"\bBP\b\s*[:=\-]\s*(\d+)\s*/\s*(\d+)", text, re.IGNORECASE)
    if bp_match:
        data["SystolicBP"] = data.get("SystolicBP", bp_match.group(1))
        data["DiastolicBP"] = data.get("DiastolicBP", bp_match.group(2))

    # If still missing, look at SystolicBP / DiastolicBP labels separately
    for field, labels in {
        "SystolicBP": FIELD_LABELS["SystolicBP"],
        "DiastolicBP": FIELD_LABELS["DiastolicBP"],
    }.items():
        if field not in data:
            for label in labels:
                pattern = rf"{re.escape(label)}\s*[:=\-]\s*(\d+)"
                value = find_first_match(pattern, text)
                if value is not None:
                    data[field] = value
                    break

    return data

def build_patient_row(data_dict):
    # Missing values become empty strings
    return {col: data_dict.get(col, "") for col in FEATURE_COLUMNS}

def create_temp_csv_from_report(report_file, temp_csv="Temp.csv"):
    text = extract_text(report_file)
    parsed = parse_report_text(text)
    row = build_patient_row(parsed)

    # You can have multiple patients; here we assume one for now
    with open(temp_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FEATURE_COLUMNS)
        writer.writeheader()
        writer.writerow(row)

    print(f"Temp.csv created with extracted values (missing values left blank): {temp_csv}")

# Example direct run
def main():
    create_temp_csv_from_report(r"C:\Users\shiva\404_not_found\ML Pipeline\sample_report.pdf", "ML Pipeline\Temp.csv")
main()