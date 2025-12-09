import pandas as pd
from fpdf import FPDF
from datetime import datetime


def generate_report_from_single_csv(csv_path, output_pdf_path="Patient_Report1.pdf"):
    """
    Reads a CSV containing EXACTLY ONE ROW representing one patient's report,
    and generates a formatted medical summary PDF.
    """

    # Load the CSV (expecting only 1 row)
    df = pd.read_csv(csv_path)

    if len(df) != 1:
        raise ValueError("CSV must contain exactly ONE row for a single patient report.")

    row = df.iloc[0]  # Extract the only row

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ---------------- Title ----------------
    pdf.set_font("Arial", "B", 18)
    pdf.cell(0, 10, "Medical Report Summary", align="C")
    pdf.ln(12)

    # small horizontal line
    pdf.set_draw_color(180, 180, 180)
    y = pdf.get_y()
    pdf.line(10, y, 200, y)
    pdf.ln(4)

    # ---------------- 1. Patient Details ----------------
    pdf.set_font("Arial", "B", 13)
    pdf.cell(0, 8, "1. Patient Details", ln=True)
    pdf.ln(2)

    pdf.set_font("Arial", "", 12)
    today = datetime.today().strftime("%Y-%m-%d")

    # two-column layout
    left_label_width = 35
    left_value_width = 60
    right_label_width = 35

    pdf.cell(left_label_width, 7, "Patient ID :", 0, 0)
    pdf.cell(left_value_width, 7, str(row.get("PatientID", "N/A")), 0, 0)
    pdf.cell(right_label_width, 7, "Gender :", 0, 0)
    pdf.cell(0, 7, str(row.get("Gender", "N/A")), ln=True)

    pdf.cell(left_label_width, 7, "Age :", 0, 0)
    pdf.cell(left_value_width, 7, str(row.get("Age", "N/A")), 0, 0)
    pdf.cell(right_label_width, 7, "Blood Group :", 0, 0)
    pdf.cell(0, 7, str(row.get("BloodGroup", "N/A")), ln=True)

    pdf.cell(left_label_width, 7, "Report Date :", 0, 0)
    pdf.cell(left_value_width, 7, today, ln=True)
    pdf.ln(4)

    # section separator
    pdf.set_draw_color(200, 200, 200)
    y = pdf.get_y()
    pdf.line(10, y, 200, y)
    pdf.ln(4)

    # ---------------- 2. Vitals ----------------
    pdf.set_font("Arial", "B", 13)
    pdf.cell(0, 8, "2. Vitals", ln=True)
    pdf.ln(2)

    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 7, f"Blood Pressure (BP) : {row.get('SystolicBP','N/A')} / {row.get('DiastolicBP','N/A')} mmHg", ln=True)
    pdf.cell(0, 7, f"Heart Rate (Pulse) : {row.get('HeartRate','N/A')} bpm", ln=True)
    pdf.cell(0, 7, f"Respiratory Rate : {row.get('RespiratoryRate','N/A')} breaths/min", ln=True)
    pdf.cell(0, 7, f"Body Temperature : {row.get('BodyTemperature','N/A')} C", ln=True)
    pdf.cell(0, 7, f"Oxygen Saturation (SpO2) : {row.get('SpO2','N/A')} %", ln=True)
    pdf.cell(
        0, 7,
        f"Blood Glucose (Fasting / Random) : {row.get('FastingSugar','N/A')} / {row.get('RandomSugar','N/A')} mg/dL",
        ln=True
    )
    pdf.cell(0, 7, f"BMI (Body Mass Index) : {row.get('BMI','N/A')}", ln=True)
    pdf.ln(4)

    pdf.set_draw_color(200, 200, 200)
    y = pdf.get_y()
    pdf.line(10, y, 200, y)
    pdf.ln(4)

    # ---------------- 3. Key Observations ----------------
    pdf.set_font("Arial", "B", 13)
    pdf.cell(0, 8, "3. Key Observations", ln=True)
    pdf.ln(2)
    pdf.set_font("Arial", "", 12)

    observations = []

    # Simple rule-based logic
    try:
        hr = float(row.get("HeartRate", 0))
        if hr > 100:
            observations.append("Heart Rate is high.")
        elif hr < 60:
            observations.append("Heart Rate is lower than normal.")
    except:
        pass

    try:
        temp = float(row.get("BodyTemperature", 0))
        if temp >= 37.5:
            observations.append("Body Temperature is elevated (possible fever).")
        elif temp < 36.0:
            observations.append("Body Temperature is below normal.")
    except:
        pass

    try:
        sbp = float(row.get("SystolicBP", 0))
        if sbp >= 140:
            observations.append("Blood Pressure is high.")
        elif sbp < 90:
            observations.append("Blood Pressure is lower than normal.")
    except:
        pass

    try:
        bmi = float(row.get("BMI", 0))
        if bmi >= 30:
            observations.append("BMI is high (obese range).")
        elif bmi < 18.5:
            observations.append("BMI is lower than normal (underweight).")
    except:
        pass

    if not observations:
        observations.append("No major abnormalities detected in basic vitals.")

    # indent bullets a bit
    for obs in observations:
        pdf.cell(5)  # indent
        pdf.multi_cell(0, 7, f"- {obs}")
    pdf.ln(2)

    pdf.set_draw_color(200, 200, 200)
    y = pdf.get_y()
    pdf.line(10, y, 200, y)
    pdf.ln(4)

    # ---------------- 4. Conclusion ----------------
    pdf.set_font("Arial", "B", 13)
    pdf.cell(0, 8, "4. Conclusion", ln=True)
    pdf.ln(2)
    pdf.set_font("Arial", "", 12)

    pdf.multi_cell(0, 7, row.get("FinalDiagnosis", "No diagnosis summary available."))
    pdf.ln(4)

    # ---------------- Disclaimer ----------------
    pdf.set_font("Arial", "I", 9)
    disclaimer = (
        "Note: This report is auto-generated from provided data. "
        "It is NOT a medical diagnosis and must be reviewed by a healthcare professional."
    )
    pdf.multi_cell(0, 5, disclaimer)

    # Save PDF
    pdf.output(output_pdf_path)
    print(f"PDF report saved: {output_pdf_path}")


user_csv = r"C:\Users\shiva\404_not_found\p.csv"
output_pdf = r"C:\Users\shiva\404_not_found\Patient_Report.pdf"

generate_report_from_single_csv(user_csv, output_pdf)
