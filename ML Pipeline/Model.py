"""
extract_to_temp.py

Usage:
    python extract_to_temp.py <input_report.(pdf|docx)> <temp_csv_path>

Example:
    python extract_to_temp.py sample_report.pdf Temp.csv
"""
import sys
import os
import re
import pandas as pd
from PyPDF2 import PdfReader
from docx import Document

# ----------------------------
# Feature columns (must match training)
# ----------------------------
FEATURE_COLUMNS = [
    "PatientID","Age","Gender","BloodGroup","SystolicBP","DiastolicBP",
    "HeartRate","RespiratoryRate","BodyTemperature","SpO2",
    "FastingSugar","RandomSugar","Glucose","Hemoglobin","WBC_Count",
    "RBC_Count","Platelet_Count","BMI","CholesterolTotal","LDL","HDL",
    "Triglycerides","Urea","Creatinine"
]

# ----------------------------
# FIELD_LABELS (variants seen in reports)
# ----------------------------
# which fields are categorical/text (never coerce to numeric during extraction)
CATEGORICAL_FIELDS = {"PatientID", "Gender", "BloodGroup"}
# blood group strict regex (A, B, AB, O with + or -)
BG_STRICT_RE = re.compile(r"\b(?:A|B|AB|O)[\s]*[+-]\b", re.IGNORECASE)
BG_RELAXED_RE = re.compile(r"\b(?:A|B|AB|O)[\s]*[+-]?\b", re.IGNORECASE)


FIELD_LABELS = {
    "PatientID": ["PatientID", "Patient ID", "ID"],
    "Age": ["Age", "Patient Age"],
    "Gender": ["Gender", "Sex"],
    "BloodGroup": ["Blood Group", "BloodGroup", "Blood group", "Bld Group"],

    "SystolicBP": ["Blood Pressure", "BP", "Systolic BP", "SystolicBP"],
    "DiastolicBP": ["Blood Pressure", "BP", "Diastolic BP", "DiastolicBP"],

    "HeartRate": ["Heart Rate", "HeartRate", "Pulse"],
    "RespiratoryRate": ["Respiratory Rate", "RespiratoryRate", "RR"],
    "BodyTemperature": ["Body Temperature", "Temperature", "Temp"],
    "SpO2": ["SpO2", "Oxygen Saturation", "O2 Saturation"],

    "FastingSugar": ["Fasting Sugar", "FBS", "Fasting Glucose", "Blood Glucose", "Blood Glucose (Fasting / Random)"],
    "RandomSugar": ["Random Sugar", "RBS", "Random Glucose", "Blood Glucose", "Blood Glucose (Fasting / Random)"],
    "Glucose": ["Glucose"],

    "Hemoglobin": ["Hemoglobin", "Hb"],
    "WBC_Count": ["WBC Count", "WBC"],
    "RBC_Count": ["RBC Count", "RBC"],
    "Platelet_Count": ["Platelet Count", "Platelets"],

    "BMI": ["BMI", "Body Mass Index"],
    "CholesterolTotal": ["Total Cholesterol", "Cholesterol Total", "Cholesterol"],
    "LDL": ["LDL"],
    "HDL": ["HDL"],
    "Triglycerides": ["Triglycerides", "TG"],
    "Urea": ["Urea"],
    "Creatinine": ["Creatinine"],
}

# Build label regex
LABEL_TO_FIELD = {}
ALL_LABELS_LIST = []
for fld, labels in FIELD_LABELS.items():
    for lbl in labels:
        LABEL_TO_FIELD[lbl.lower()] = fld
        ALL_LABELS_LIST.append(re.escape(lbl))
label_pattern = re.compile(r"\b(" + "|".join(sorted(ALL_LABELS_LIST, key=len, reverse=True)) + r")\b", re.IGNORECASE)

# numeric regexes
single_num_re = re.compile(r"(\d+(?:\.\d+)?)")
slash_pair_re = re.compile(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)")

# ----------------------------
# Text extraction
# ----------------------------
def extract_text(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)
    ext = file_path.lower().split('.')[-1]
    if ext == "pdf":
        text = ""
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return text
    elif ext == "docx":
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type; use .pdf or .docx")

# ----------------------------
# Generalized parsing rule:
# For each label found in document order, search forward until
# first numeric or next label; take that first numeric(s). Never overwrite a field.
# ----------------------------
def generalized_parse_report_text(text):
    """
    Extracts fields using label scanning. Categorical fields (Gender, BloodGroup, PatientID)
    are taken as first non-numeric token (for BG we prefer strict BG tokens).
    Numeric fields keep the first numeric found in the label->next-label window.
    """
    data = {}
    if not text:
        return data

    matches = list(label_pattern.finditer(text))
    text_len = len(text)

    # fallback line-based if no labels
    if not matches:
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            low = line.lower()
            for lbl, fld in LABEL_TO_FIELD.items():
                if lbl in low and fld not in data:
                    # categorical
                    if fld in CATEGORICAL_FIELDS:
                        # try strict BG first
                        if fld == "BloodGroup":
                            m_bg = BG_STRICT_RE.search(line)
                            if m_bg:
                                data[fld] = m_bg.group(0).replace(" ", "").upper()
                                continue
                            m_rel = BG_RELAXED_RE.search(line)
                            if m_rel:
                                data[fld] = m_rel.group(0).replace(" ", "").upper()
                                continue
                        # Gender/ID: take first alpha token (non-numeric)
                        m_word = re.search(r"[A-Za-z][A-Za-z0-9/_+-]{0,10}", line)
                        if m_word:
                            data[fld] = m_word.group(0).strip()
                            continue
                    # numeric or pair
                    m_pair = slash_pair_re.search(line)
                    if m_pair and fld in ("SystolicBP", "DiastolicBP"):
                        data.setdefault("SystolicBP", m_pair.group(1))
                        data.setdefault("DiastolicBP", m_pair.group(2))
                    else:
                        m_num = single_num_re.search(line)
                        if m_num:
                            data.setdefault(fld, m_num.group(1))
        return data

    # labeled scanning
    for idx, m in enumerate(matches):
        label_text = m.group(0)
        label_lower = label_text.lower()
        field = LABEL_TO_FIELD.get(label_lower)
        if field is None:
            for k, v in LABEL_TO_FIELD.items():
                if k in label_lower:
                    field = v
                    break
        if field is None:
            continue

        start_pos = m.end()
        end_pos = matches[idx+1].start() if (idx+1) < len(matches) else text_len
        snippet = text[start_pos:end_pos].strip()

        # if field already set, skip (keep first occurrence)
        if field in data:
            continue

        # categorical handling
        if field in CATEGORICAL_FIELDS:
            # BloodGroup: prefer strict BG
            if field == "BloodGroup":
                m_bg = BG_STRICT_RE.search(snippet)
                if m_bg:
                    data[field] = m_bg.group(0).replace(" ", "").upper()
                    continue
                m_rel = BG_RELAXED_RE.search(snippet)
                if m_rel:
                    data[field] = m_rel.group(0).replace(" ", "").upper()
                    continue
            # Gender or PatientID: find first token that contains a letter (not pure numeric)
            m_token = re.search(r"[A-Za-z][A-Za-z0-9/_+-]{0,20}", snippet)
            if m_token:
                data[field] = m_token.group(0).strip()
                continue
            # fallback: if nothing found, maybe the label sits on previous line; try short lookbehind
            front = text[max(0, start_pos-40):start_pos]
            m_token2 = re.search(r"[A-Za-z][A-Za-z0-9/_+-]{0,20}", front)
            if m_token2:
                data[field] = m_token2.group(0).strip()
            continue  # done with categorical

        # BP pair special-case
        if "bp" in label_lower or "blood pressure" in label_lower:
            bp_m = slash_pair_re.search(snippet)
            if bp_m:
                data["SystolicBP"] = bp_m.group(1)
                data["DiastolicBP"] = bp_m.group(2)
                continue
            n_m = single_num_re.search(snippet)
            if n_m:
                data["SystolicBP"] = n_m.group(1)
                continue

        # glucose pair
        if ("fasting" in label_lower and "random" in label_lower) or ("blood glucose" in label_lower and "/" in snippet):
            pair_m = slash_pair_re.search(snippet)
            if pair_m:
                data["FastingSugar"] = pair_m.group(1)
                data["RandomSugar"] = pair_m.group(2)
                continue
            n_m = single_num_re.search(snippet)
            if n_m:
                data["Glucose"] = n_m.group(1)
                continue

        # generic numeric
        n_m = single_num_re.search(snippet)
        if n_m:
            data[field] = n_m.group(1)

    # Normalize Gender tokens
    if "Gender" in data:
        g = str(data["Gender"]).strip().lower()
        if g.startswith("m"):
            data["Gender"] = "Male"
        elif g.startswith("f"):
            data["Gender"] = "Female"
        else:
            data["Gender"] = data["Gender"]

    return data


# ----------------------------
# Build row and write Temp.csv
# ----------------------------
def build_patient_row(data_dict):
    return {col: data_dict.get(col, "") for col in FEATURE_COLUMNS}

def validate_row_strings(row_dict):
    """
    Simple validator: ensure numeric columns look numeric; if not, warn.
    Returns list of problematic columns.
    """
    problems = []
    for col in FEATURE_COLUMNS:
        if col in CATEGORICAL_FIELDS:
            continue
        # numeric expected columns: check if value empty or numeric-like
        val = row_dict.get(col, "")
        if val is None or val == "":
            continue
        # allow integers/floats
        try:
            float(val)
        except Exception:
            problems.append(col)
    return problems

def create_temp_csv_from_report(report_file, temp_csv="Temp.csv"):
    text = extract_text(report_file)
    parsed = generalized_parse_report_text(text)
    # Ensure categorical columns are strings, keep as-is
    row = build_patient_row(parsed)
    # convert all values to string to avoid pandas coercion
    row = {k: ("" if v is None else str(v)) for k, v in row.items()}

    # validate numeric-looking columns
    problems = validate_row_strings(row)
    if problems:
        print("[WARN] Non-numeric values in numeric fields detected (possible column shift):", problems)
        # optional: save a diagnostic copy
        import json
        with open(temp_csv + ".diagnostic.json", "w", encoding="utf-8") as fh:
            json.dump({"parsed": parsed, "row": row, "problems": problems}, fh, indent=2)

    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    # write with quoting, preserve strings
    df.to_csv(temp_csv, index=False, quoting=1)  # quoting=csv.QUOTE_MINIMAL (1)
    print(f"[OK] Temp.csv created: {temp_csv}")


# ----------------------------
# CLI
# ----------------------------
def main():
    input_path = r"C:\Users\shiva\404_not_found\ML Pipeline\sample_report.pdf"
    temp_csv = "ML Pipeline\Temp.csv"
    create_temp_csv_from_report(input_path, temp_csv)

main()


"""
infer_and_pdf.py

Usage:
    python infer_and_pdf.py <Temp.csv> <output_test_csv> <final_pdf>

Example:
    python infer_and_pdf.py Temp.csv Test.csv Final_Report.pdf

It expects the following artifacts (produced by your training script) in the working directory:
 - imputer.pkl            (package with numeric_cols, categorical_cols, num_imputer, cat_imputer)
 - cat_encoders.pkl       (dict of LabelEncoder objects used for categorical features)
 - training_columns.pkl   (list of FEATURE_COLUMNS in same order as training)
 - ensemble_3models.pkl   (saved ensemble model)
 - label_encoder.pkl      (LabelEncoder for the target)
"""
import os
import sys
import joblib
import pandas as pd
import numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# ----------------------------
# Helper to load artifacts
# ----------------------------
def load_artifacts(imputer_path="imputer.pkl", cat_encoders_path="cat_encoders.pkl",
                   training_columns_path="training_columns.pkl",
                   model_path="ensemble_3models.pkl", label_encoder_path="label_encoder.pkl"):
    if not os.path.exists(imputer_path):
        raise FileNotFoundError(imputer_path)
    if not os.path.exists(cat_encoders_path):
        raise FileNotFoundError(cat_encoders_path)
    if not os.path.exists(training_columns_path):
        raise FileNotFoundError(training_columns_path)
    if not os.path.exists(model_path):
        raise FileNotFoundError(model_path)
    if not os.path.exists(label_encoder_path):
        raise FileNotFoundError(label_encoder_path)

    imputer_pkg = joblib.load(imputer_path)
    cat_encoders = joblib.load(cat_encoders_path)
    training_columns = joblib.load(training_columns_path)
    model = joblib.load(model_path)
    label_enc = joblib.load(label_encoder_path)

    return imputer_pkg, cat_encoders, training_columns, model, label_enc

# ----------------------------
# Inference: impute new Temp.csv -> Test.csv
# ----------------------------
def impute_temp_to_test(temp_csv, test_csv, imputer_pkg, cat_encoders, training_columns):
    df_temp = pd.read_csv(temp_csv, dtype=str)
    # ensure all training columns exist
    for c in training_columns:
        if c not in df_temp.columns:
            df_temp[c] = ""

    numeric_cols = imputer_pkg["numeric_cols"]
    categorical_cols = imputer_pkg["categorical_cols"]
    num_imputer = imputer_pkg["num_imputer"]
    cat_imputer = imputer_pkg["cat_imputer"]

    # prepare numeric frame
    X_num = pd.DataFrame()
    if numeric_cols:
        X_num = df_temp[numeric_cols].apply(pd.to_numeric, errors="coerce")

    # categorical frame
    X_cat = pd.DataFrame()
    if categorical_cols:
        X_cat = df_temp[categorical_cols].astype(str).replace("nan", "")

    # impute
    X_num_imputed = pd.DataFrame(num_imputer.transform(X_num), columns=numeric_cols, index=df_temp.index) if numeric_cols else pd.DataFrame(index=df_temp.index)
    X_cat_imputed = pd.DataFrame(cat_imputer.transform(X_cat), columns=categorical_cols, index=df_temp.index) if categorical_cols else pd.DataFrame(index=df_temp.index)

    # apply saved LabelEncoders to categorical columns (map unseen -> first known class)
    for col, enc in cat_encoders.items():
        if col in X_cat_imputed.columns:
            # ensure string
            vals = X_cat_imputed[col].astype(str).tolist()
            out = []
            known = set(enc.classes_.tolist())
            fallback = enc.transform([enc.classes_[0]])[0]  # fallback to first known class index
            for v in vals:
                if v in known:
                    out.append(enc.transform([v])[0])
                else:
                    out.append(fallback)
            X_cat_imputed[col] = out

    # Reconstruct Test DataFrame in training_columns order
    df_test = pd.concat([X_num_imputed, X_cat_imputed], axis=1)
    # keep all training columns, fill missing with blanks or zeros
    for c in training_columns:
        if c not in df_test.columns:
            df_test[c] = 0 if c in numeric_cols else ""

    df_test = df_test[training_columns]
    df_test.to_csv(test_csv, index=False)
    print(f"[OK] Test.csv saved: {test_csv}")
    return df_test, df_temp

# ----------------------------
# Predict and update Temp.csv
# ----------------------------
def predict_and_update_temp(df_test, df_temp, model, label_enc, temp_csv_out):
    # model expects numeric/categorical encoded values exactly as training
    preds = model.predict(df_test)
    # inverse transform labels
    try:
        pred_labels = label_enc.inverse_transform(preds)
    except Exception:
        # if label encoder was not used or different, fallback to str
        pred_labels = [str(p) for p in preds]

    df_temp["PredictedLabel"] = pred_labels
    df_temp.to_csv(temp_csv_out, index=False)
    print(f"[OK] Temp.csv updated with predictions: {temp_csv_out}")
    return df_temp

# ----------------------------
# PDF summarization: create a simple 1-page summary for first patient row
# ----------------------------
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from textwrap import wrap
import pandas as pd
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from textwrap import wrap
import pandas as pd
from datetime import datetime
import re

def temp_to_summary_pdf(temp_csv, output_pdf, title="Medical Report Summary"):
    """
    Improved PDF generator with BloodGroup sanitization:
    - If BloodGroup looks like a date/number, scan other fields for valid blood-group tokens (A+, O-, AB+, etc.)
    - Avoid showing a year/date where BloodGroup should be.
    """
    df = pd.read_csv(temp_csv, dtype=str)
    if df.shape[0] == 0:
        raise ValueError("Temp.csv has no rows")

    row = df.iloc[0].to_dict()

    # Basic extraction helpers
    def get_str(k):
        v = row.get(k, "")
        return "" if pd.isna(v) else str(v).strip()

    patient_id = get_str("PatientID")
    age = get_str("Age")
    # ensure age shows only integer/float nicely
    try:
        age = str(int(float(age))) if age != "" else ""
    except Exception:
        # keep as-is if not numeric
        age = age

    gender = get_str("Gender")
    bgroup_raw = get_str("BloodGroup")
    report_date = get_str("ReportDate") or datetime.today().strftime("%Y-%m-%d")

    # --- sanitize BloodGroup ---
    # valid BG patterns like A, B, O, AB optionally with + or -
    bg_pattern = re.compile(r"\b(?:A|B|AB|O)[\s]*[+-]?\b", re.IGNORECASE)
    # normalized pattern for full forms with +/-
    bg_strict = re.compile(r"\b(?:A|B|AB|O)[+-]\b", re.IGNORECASE)

    def is_probable_date_or_year(s):
        if not s:
            return False
        s = s.strip()
        # common date patterns or pure year
        if re.match(r"^\d{4}$", s):  # e.g. 2025
            return True
        if re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}$", s):  # 12/10/2025
            return True
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s):  # 2025-12-10
            return True
        # if it contains lots of digits and slashes/dashes -> treat as date
        if re.search(r"\d", s) and ("/" in s or "-" in s):
            return True
        return False

    def find_bg_in_row(rdict):
        # scan all values for a strict blood group first, then relaxed
        for v in rdict.values():
            if not v:
                continue
            try:
                s = str(v)
            except Exception:
                continue
            if bg_strict.search(s):
                return bg_strict.search(s).group(0).replace(" ", "").upper()
        for v in rdict.values():
            if not v:
                continue
            s = str(v)
            m = bg_pattern.search(s)
            if m:
                return m.group(0).replace(" ", "").upper()
        return ""

    # if the raw bloodgroup looks like a date/year/number, search the row for a real blood group
    bgroup = bgroup_raw
    if is_probable_date_or_year(bgroup_raw) or (bgroup_raw and not bg_pattern.search(bgroup_raw)):
        found = find_bg_in_row(row)
        if found:
            bgroup = found
        else:
            # as a last step, if the value is obviously wrong (a date), clear it
            if is_probable_date_or_year(bgroup_raw):
                bgroup = ""
            else:
                # if it's something else but not a valid BG, keep empty to avoid confusion
                if not bg_pattern.search(bgroup_raw):
                    bgroup = bgroup_raw if bg_pattern.search(bgroup_raw) else ""

    # Observations / conclusion parsing
    key_obs_raw = get_str("KeyObservations")
    if isinstance(key_obs_raw, str) and key_obs_raw.strip().startswith("[") and key_obs_raw.strip().endswith("]"):
        try:
            import ast
            parsed = ast.literal_eval(key_obs_raw)
            key_observations = parsed if isinstance(parsed, (list, tuple)) else [str(parsed)]
        except Exception:
            key_observations = [key_obs_raw]
    elif key_obs_raw and ("\n" in key_obs_raw):
        key_observations = [s.strip() for s in key_obs_raw.splitlines() if s.strip()]
    elif key_obs_raw:
        key_observations = [key_obs_raw]
    else:
        key_observations = ["No major abnormalities detected in basic vitals."]

    conclusion = get_str("Conclusion") or "Healthy patient with normal vital signs and laboratory values."
    predicted = get_str("PredictedLabel") or get_str("DiagnosisCategory") or ""

    # Important vitals to show (same lambdas as before)
    vitals_items = [
        ("Blood Pressure (BP)", lambda r: f"{get_str('SystolicBP')}".strip() + ((" / " + f"{get_str('DiastolicBP')}".strip()) if get_str('DiastolicBP') else "")),
        ("Heart Rate (Pulse)", lambda r: f"{get_str('HeartRate')}".strip() + (" bpm" if get_str('HeartRate') else "")),
        ("Respiratory Rate", lambda r: f"{get_str('RespiratoryRate')}".strip() + (" breaths/min" if get_str('RespiratoryRate') else "")),
        ("Body Temperature", lambda r: f"{get_str('BodyTemperature')}".strip() + (" C" if get_str('BodyTemperature') else "")),
        ("Oxygen Saturation (SpO2)", lambda r: f"{get_str('SpO2')}".strip() + (" %" if get_str('SpO2') else "")),
        ("Blood Glucose (Fasting / Random)", lambda r: (f"{get_str('FastingSugar')}".strip() + ((" / " + f"{get_str('RandomSugar')}".strip()) if get_str('RandomSugar') else "")) + (" mg/dL" if (get_str('FastingSugar') or get_str('RandomSugar')) else "")),
        ("BMI (Body Mass Index)", lambda r: f"{get_str('BMI')}".strip())
    ]

    # page setup
    c = canvas.Canvas(output_pdf, pagesize=A4)
    W, H = A4
    left_x = 50
    right_x = W - 50
    y = H - 50
    section_gap = 12
    small_gap = 6

    # Title (centered)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W/2, y, title)
    y -= 28

    # thin separator line
    c.setStrokeColor(colors.grey)
    c.setLineWidth(0.6)
    c.line(left_x, y, right_x, y)
    y -= 18

    # 1. Patient Details (two-column)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x, y, "1. Patient Details")
    y -= 16

    # Left and right column positions
    col1_x = left_x
    col2_x = W/2 + 10

    # details rows (include BloodGroup sanitized)
    details = [
        ("Patient ID", patient_id),
        ("Age", age),
        ("Report Date", report_date)
    ]
    right_details = [
        ("Gender", gender),
        ("Blood Group", bgroup),
        ("", "")
    ]

    # draw pairs row-wise
    max_rows = max(len(details), len(right_details))
    row_height = 16
    for i in range(max_rows):
        left_label, left_val = details[i] if i < len(details) else ("","")
        right_label, right_val = right_details[i] if i < len(right_details) else ("","")
        # left
        c.setFont("Helvetica", 10)
        c.drawString(col1_x, y, f"{left_label} :")
        c.drawString(col1_x + 80, y, str(left_val))
        # right
        c.drawString(col2_x, y, f"{right_label} :")
        c.drawString(col2_x + 80, y, str(right_val))
        y -= row_height

    y -= small_gap
    # separator
    c.setLineWidth(0.4)
    c.line(left_x, y, right_x, y)
    y -= section_gap

    # 2. Vitals
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x, y, "2. Vitals")
    y -= 16
    c.setFont("Helvetica", 10)

    for label, fn in vitals_items:
        val = fn(row)
        if val and val.strip():
            text = f"{label} : {val}"
            wrapped = wrap(text, 95)
            for line in wrapped:
                c.drawString(left_x, y, line)
                y -= 14
                if y < 80:
                    c.showPage()
                    y = H - 50
                    c.setFont("Helvetica", 10)
    y -= small_gap
    c.line(left_x, y, right_x, y)
    y -= section_gap

    # 3. Key Observations

    # c.setFont("Helvetica-Bold", 12)
    # c.drawString(left_x, y, "3. Key Observations")
    # y -= 16
    # c.setFont("Helvetica", 10)
    # for obs in key_observations:
    #     obs_lines = wrap(str(obs), 100)
    #     c.drawString(left_x + 6, y, "- " + obs_lines[0])
    #     y -= 14
    #     for cont in obs_lines[1:]:
    #         c.drawString(left_x + 16, y, cont)
    #         y -= 14
    #     if y < 80:
    #         c.showPage()
    #         y = H - 50
    #         c.setFont("Helvetica", 10)
    # y -= small_gap
    # c.line(left_x, y, right_x, y)
    # y -= section_gap

    # # 4. Conclusion

    # c.setFont("Helvetica-Bold", 12)
    # c.drawString(left_x, y, "4. Conclusion")
    # y -= 16
    # c.setFont("Helvetica", 10)
    # concl_lines = wrap(conclusion, 110)
    # for line in concl_lines:
    #     c.drawString(left_x, y, line)
    #     y -= 14
    #     if y < 80:
    #         c.showPage()
    #         y = H - 50
    #         c.setFont("Helvetica", 10)

    # y -= 14
    # Predicted label box
    if predicted:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(left_x, y, f"Predicted Diagnosis: {predicted}")
        y -= 16

    # Footer note (italic, grey)
    footer_note = row.get("FooterNote", "Note: This report is auto-generated from provided data. It is NOT a medical diagnosis and must be reviewed by a healthcare professional.")
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.grey)
    # place footer at bottom
    footer_y = 35
    # wrap footer
    f_lines = wrap(footer_note, 120)
    fx = left_x
    for i, fl in enumerate(f_lines):
        c.drawString(fx, footer_y + (i * 10), fl)
    c.setFillColor(colors.black)

    c.showPage()
    c.save()
    print(f"[OK] Final PDF created: {output_pdf}")


# ----------------------------
# CLI wrapper
# ----------------------------
def func():
    temp_csv = r"C:\Users\shiva\404_not_found\ML Pipeline\Temp.csv"      # Temp.csv produced by extractor
    test_csv = r"C:\Users\shiva\404_not_found\ML Pipeline\Test.csv"    # where to save imputed Test.csv
    final_pdf = r"C:\Users\shiva\404_not_found\ML Pipeline\Final.pdf"      # output PDF path
    temp_csv_out = temp_csv      # we will overwrite same Temp.csv with predictions

    # load artifacts
    imputer_pkg, cat_encoders, training_columns, model, label_enc = load_artifacts(
        imputer_path=r"C:\Users\shiva\404_not_found\ML Pipeline\imputer.pkl",
        cat_encoders_path=r"C:\Users\shiva\404_not_found\ML Pipeline\cat_encoders.pkl",
        training_columns_path=r"C:\Users\shiva\404_not_found\ML Pipeline\training_columns.pkl",
        model_path=r"C:\Users\shiva\404_not_found\ML Pipeline\ensemble_3models.pkl",
        label_encoder_path=r"C:\Users\shiva\404_not_found\ML Pipeline\label_encoder.pkl"
    )

    # impute & save Test.csv
    df_test, df_temp = impute_temp_to_test(temp_csv, test_csv, imputer_pkg, cat_encoders, training_columns)

    # predict and update Temp.csv with label
    df_temp_upd = predict_and_update_temp(df_test, df_temp, model, label_enc, temp_csv_out)

    # make summarized pdf (for first row)
    temp_to_summary_pdf(temp_csv_out, final_pdf)

    print("[OK] All done!")

func()