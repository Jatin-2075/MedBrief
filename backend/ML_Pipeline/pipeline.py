import os
import uuid
import shutil
from .extractor import create_temp_csv_from_report
from .inference import (
    load_artifacts,
    impute_temp_to_test,
    predict_and_update_temp,
    temp_to_summary_pdf
)

BASE_DIR = os.path.dirname(__file__)
TEMP_DIR = os.path.join(BASE_DIR, "Temp")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

# ✅ Load artifacts ONCE at startup
try:
    IMPUTER, CAT_ENCODERS, TRAIN_COLS, MODEL, LABEL_ENC = load_artifacts(ARTIFACTS_DIR)
except Exception as e:
    raise RuntimeError(f"Failed to load ML artifacts at startup: {e}")


def run_pipeline(file_bytes, filename):
    run_id = uuid.uuid4().hex
    run_path = os.path.join(TEMP_DIR, run_id)
    os.makedirs(run_path, exist_ok=True)

    try:
        input_pdf = os.path.join(run_path, filename)
        temp_csv = os.path.join(run_path, "Temp.csv")
        test_csv = os.path.join(run_path, "Test.csv")
        final_pdf = os.path.join(run_path, "Final.pdf")

        # Save uploaded file
        with open(input_pdf, "wb") as f:
            f.write(file_bytes)

        # Step 1: Extract → Temp.csv
        create_temp_csv_from_report(input_pdf, temp_csv)

        # Step 2: Impute → Test.csv
        df_test, df_temp = impute_temp_to_test(
            temp_csv,
            test_csv,
            IMPUTER,
            CAT_ENCODERS,
            TRAIN_COLS
        )

        # Step 3: Predict
        predict_and_update_temp(
            df_test,
            df_temp,
            MODEL,
            LABEL_ENC,
            temp_csv
        )

        # Step 4: Generate PDF
        temp_to_summary_pdf(temp_csv, final_pdf)

        # Step 5: Return meaningful summary
        summary_text = (
            f"Predicted diagnosis: {df_temp['PredictedLabel'].iloc[0]}. "
            "Please consult a medical professional."
        )

        return summary_text, final_pdf

    finally:
        shutil.rmtree(run_path, ignore_errors=True)
