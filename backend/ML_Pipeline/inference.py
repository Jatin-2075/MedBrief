import os
import joblib
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from textwrap import wrap
from datetime import datetime

# =========================================================
# Load ML artifacts
# =========================================================
def load_artifacts(base_path):
    return (
        joblib.load(os.path.join(base_path, "imputer.pkl")),
        joblib.load(os.path.join(base_path, "cat_encoders.pkl")),
        joblib.load(os.path.join(base_path, "training_columns.pkl")),
        joblib.load(os.path.join(base_path, "ensemble_3models.pkl")),
        joblib.load(os.path.join(base_path, "label_encoder.pkl")),
    )

# =========================================================
# Imputation + encoding (CRITICAL)
# =========================================================
def impute_temp_to_test(temp_csv, test_csv, imputer_pkg, cat_encoders, training_columns):
    df_temp = pd.read_csv(temp_csv, dtype=str)

    for col in training_columns:
        if col not in df_temp.columns:
            df_temp[col] = ""

    numeric_cols = imputer_pkg["numeric_cols"]
    categorical_cols = imputer_pkg["categorical_cols"]

    X_num = df_temp[numeric_cols].apply(pd.to_numeric, errors="coerce")
    X_cat = df_temp[categorical_cols].astype(str).replace("nan", "")

    X_num_imp = pd.DataFrame(
        imputer_pkg["num_imputer"].transform(X_num),
        columns=numeric_cols,
        index=df_temp.index
    )

    X_cat_imp = pd.DataFrame(
        imputer_pkg["cat_imputer"].transform(X_cat),
        columns=categorical_cols,
        index=df_temp.index
    )

    # Encode categoricals safely
    for col, enc in cat_encoders.items():
        if col in X_cat_imp.columns:
            X_cat_imp[col] = X_cat_imp[col].apply(
                lambda v: enc.transform([v])[0] if v in enc.classes_
                else enc.transform([enc.classes_[0]])[0]
            )

    df_test = pd.concat([X_num_imp, X_cat_imp], axis=1)
    df_test = df_test[training_columns]

    df_test.to_csv(test_csv, index=False)
    return df_test, df_temp

# =========================================================
# Prediction
# =========================================================
def predict_and_update_temp(df_test, df_temp, model, label_enc, temp_csv_out):
    preds = model.predict(df_test)

    try:
        labels = label_enc.inverse_transform(preds)
    except Exception:
        labels = preds.astype(str)

    df_temp["PredictedLabel"] = labels
    df_temp.to_csv(temp_csv_out, index=False)

    return df_temp

# =========================================================
# PDF generator (REAL SUMMARY)
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from textwrap import wrap
import pandas as pd
from datetime import datetime

def temp_to_summary_pdf(temp_csv, output_pdf, title="Medical Report Summary"):
    df = pd.read_csv(temp_csv, dtype=str)
    if df.empty:
        raise ValueError("Temp.csv has no data")

    row = df.iloc[0].to_dict()

    # -------- Helpers --------
    def get(k, default=""):
        v = row.get(k, default)
        return "" if pd.isna(v) else str(v).strip()

    patient_id = get("PatientID")
    age = get("Age")
    gender = get("Gender")
    bgroup = get("BloodGroup")
    report_date = datetime.today().strftime("%d %b %Y")
    predicted = get("PredictedLabel")

    vitals_items = [
        ("Blood Pressure", f"{get('SystolicBP')} / {get('DiastolicBP')}".strip(" /")),
        ("Heart Rate", f"{get('HeartRate')} bpm"),
        ("Respiratory Rate", f"{get('RespiratoryRate')} breaths/min"),
        ("Body Temperature", f"{get('BodyTemperature')} °C"),
        ("SpO₂", f"{get('SpO2')} %"),
        ("Blood Sugar", f"{get('FastingSugar')} / {get('RandomSugar')} mg/dL".strip(" /")),
        ("BMI", get("BMI")),
    ]

    # -------- Page setup --------
    c = canvas.Canvas(output_pdf, pagesize=A4)
    W, H = A4
    left_x = 50
    right_x = W - 50
    y = H - 50

    section_gap = 14
    line_gap = 14

    # -------- Title --------
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(W / 2, y, title)
    y -= 30

    c.setStrokeColor(colors.grey)
    c.setLineWidth(0.6)
    c.line(left_x, y, right_x, y)
    y -= 22

    # -------- 1. Patient Details --------
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x, y, "1. Patient Details")
    y -= 18

    c.setFont("Helvetica", 10)
    col1_x = left_x
    col2_x = W / 2 + 10

    details_left = [
        ("Patient ID", patient_id),
        ("Age", age),
        ("Report Date", report_date),
    ]

    details_right = [
        ("Gender", gender),
        ("Blood Group", bgroup),
    ]

    max_rows = max(len(details_left), len(details_right))
    for i in range(max_rows):
        if i < len(details_left):
            c.drawString(col1_x, y, f"{details_left[i][0]}:")
            c.drawString(col1_x + 90, y, details_left[i][1])
        if i < len(details_right):
            c.drawString(col2_x, y, f"{details_right[i][0]}:")
            c.drawString(col2_x + 90, y, details_right[i][1])
        y -= line_gap

    y -= 6
    c.line(left_x, y, right_x, y)
    y -= section_gap

    # -------- 2. Vitals --------
    c.setFont("Helvetica-Bold", 12)
    c.drawString(left_x, y, "2. Vitals")
    y -= 18

    c.setFont("Helvetica", 10)
    for label, value in vitals_items:
        if value.strip():
            wrapped = wrap(f"{label}: {value}", 95)
            for line in wrapped:
                if y < 80:
                    c.showPage()
                    y = H - 50
                    c.setFont("Helvetica", 10)
                c.drawString(left_x, y, line)
                y -= line_gap

    y -= 6
    c.line(left_x, y, right_x, y)
    y -= section_gap

    # -------- Predicted Diagnosis --------
    if predicted:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(left_x, y, "Predicted Diagnosis")
        y -= 16

        c.setFont("Helvetica", 11)
        c.drawString(left_x, y, predicted)
        y -= section_gap

    # -------- Footer --------
    footer = (
        "Note: This report is auto-generated using machine learning models. "
        "It is NOT a medical diagnosis and must be reviewed by a licensed healthcare professional."
    )

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.grey)

    footer_lines = wrap(footer, 120)
    footer_y = 35
    for i, line in enumerate(footer_lines):
        c.drawString(left_x, footer_y + (i * 10), line)

    c.setFillColor(colors.black)
    c.showPage()
    c.save()

    print(f"[OK] Final PDF created: {output_pdf}")
