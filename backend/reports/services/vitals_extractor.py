import re


def extract_vitals(text: str) -> dict:
    """
    Extract vitals from medical report text.
    Supports common formats with parentheses, units, and combined values.
    """

    if not text:
        return {}

    vitals = {}

    # --------------------------------------------------
    # Blood Pressure: 128 / 82 mmHg
    # --------------------------------------------------
    bp_match = re.search(
        r"Blood\s*Pressure.*?(\d{2,3})\s*/\s*(\d{2,3})",
        text,
        re.IGNORECASE,
    )
    if bp_match:
        vitals["blood_pressure"] = f"{bp_match.group(1)}/{bp_match.group(2)}"

    # --------------------------------------------------
    # Heart Rate / Pulse: 72 bpm
    # --------------------------------------------------
    hr_match = re.search(
        r"(Heart\s*Rate|Pulse).*?(\d{2,3})\s*(bpm|beats)?",
        text,
        re.IGNORECASE,
    )
    if hr_match:
        vitals["heart_rate"] = hr_match.group(2)

    # --------------------------------------------------
    # Respiratory Rate: 16 breaths/min
    # --------------------------------------------------
    rr_match = re.search(
        r"Respiratory\s*Rate.*?(\d{1,2})",
        text,
        re.IGNORECASE,
    )
    if rr_match:
        vitals["respiratory_rate"] = rr_match.group(1)

    # --------------------------------------------------
    # Body Temperature: 36.7 C
    # --------------------------------------------------
    temp_match = re.search(
        r"(Body\s*Temperature|Temperature).*?([\d\.]+)\s*(C|F)",
        text,
        re.IGNORECASE,
    )
    if temp_match:
        vitals["body_temperature"] = temp_match.group(2)

    # --------------------------------------------------
    # SpO2 / Oxygen Saturation: 98 %
    # --------------------------------------------------
    spo2_match = re.search(
        r"(SpO2|Oxygen\s*Saturation).*?(\d{2,3})\s*%",
        text,
        re.IGNORECASE,
    )
    if spo2_match:
        vitals["spo2"] = spo2_match.group(2)

    # --------------------------------------------------
    # Blood Glucose (Fasting / Random): 95 / 130 mg/dL
    # --------------------------------------------------
    glucose_match = re.search(
        r"Blood\s*Glucose.*?(\d{2,3})\s*/\s*(\d{2,3})",
        text,
        re.IGNORECASE,
    )
    if glucose_match:
        vitals["fasting_glucose"] = glucose_match.group(1)
        vitals["random_glucose"] = glucose_match.group(2)

    # --------------------------------------------------
    # BMI: 24.8
    # --------------------------------------------------
    bmi_match = re.search(
        r"\bBMI.*?([\d\.]+)",
        text,
        re.IGNORECASE,
    )
    if bmi_match:
        vitals["bmi"] = bmi_match.group(1)

    return vitals
