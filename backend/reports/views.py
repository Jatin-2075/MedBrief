from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import MedicalReport
from .services.text_extractor import extract_text
from .services.text_normalizer import normalize_text
from .services.patient_extractor import extract_patient_details
from .services.vitals_extractor import extract_vitals
from .services.vitals_comparator import compare_vitals
from .services.observation_engine import generate_observations
from .services.conclusion_engine import generate_conclusion
from .services.pdf_generator import generate_summary_pdf



# ==========================================================
# UPLOAD & PROCESS REPORT
# ==========================================================
@method_decorator(csrf_exempt, name="dispatch")  # DEV ONLY
class UploadReportView(APIView):
    """
    Upload medical report, extract text, parse patient details & vitals,
    compare vitals with normal ranges, generate observations & conclusion,
    and return structured summary.
    """

    ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    MAX_FILE_SIZE_MB = 10

    def post(self, request):
        # --------------------------------------------------
        # 1. Validate file
        # --------------------------------------------------
        file = request.FILES.get("report")

        if not file:
            return Response(
                {"error": "No report file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > self.MAX_FILE_SIZE_MB * 1024 * 1024:
            return Response(
                {"error": "File size exceeds 10 MB limit"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not any(file.name.lower().endswith(ext) for ext in self.ALLOWED_EXTENSIONS):
            return Response(
                {"error": "Unsupported file type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # 2. Save file metadata
        # --------------------------------------------------
        report = MedicalReport.objects.create(
            file=file,
            original_filename=file.name,
            file_size_kb=round(file.size / 1024, 2),
        )

        # --------------------------------------------------
        # 3. Extract & normalize text
        # --------------------------------------------------
        raw_text = extract_text(report.file.path)
        text = normalize_text(raw_text)

        # --------------------------------------------------
        # 4. Extract patient details
        # --------------------------------------------------
        patient_details = extract_patient_details(text)
        patient_details = {
            k: v if v else "Not Available"
            for k, v in patient_details.items()
        }

        # --------------------------------------------------
        # 5. Extract vitals
        # --------------------------------------------------
        vitals = extract_vitals(text)

        # --------------------------------------------------
        # 6. Compare vitals with normal ranges
        # --------------------------------------------------
        comparison_table = compare_vitals(
            vitals=vitals,
            gender=patient_details.get("gender"),
        )

        # --------------------------------------------------
        # 7. Generate key observations
        # --------------------------------------------------
        observations = generate_observations(comparison_table)

        # --------------------------------------------------
        # 8. Generate final conclusion
        # --------------------------------------------------
        final_conclusion = generate_conclusion(comparison_table)

        # --------------------------------------------------
        # 9. Persist everything
        # --------------------------------------------------
        report.extracted_text = text
        report.patient_details = patient_details
        report.vitals = vitals
        report.comparison_table = comparison_table
        report.key_observations = observations
        report.final_conclusion = final_conclusion
        report.save()

        # --------------------------------------------------
        # 10. API response
        # --------------------------------------------------
        return Response(
            {
                "message": "Report processed successfully",
                "report_id": report.id,
                "patient_details": patient_details,
                "vitals_comparison": comparison_table,
                "key_observations": observations,
                "final_conclusion": final_conclusion,
                "disclaimer": (
                    "This summary is generated automatically and is not a medical diagnosis. "
                    "Please consult a certified doctor for professional advice."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================================
# DOWNLOAD SUMMARY PDF
# ==========================================================
class DownloadReportPDF(APIView):
    """
    Generate and download the medical report summary PDF.
    """

    def get(self, request, report_id):
        try:
            report = MedicalReport.objects.get(id=report_id)
        except MedicalReport.DoesNotExist:
            raise Http404("Report not found")

        pdf_path = Path(settings.MEDIA_ROOT) / f"report_summary_{report_id}.pdf"

        generate_summary_pdf(report, pdf_path)

        return FileResponse(
            pdf_path.open("rb"),
            as_attachment=True,
            filename=f"Medical_Report_Summary_{report_id}.pdf",
        )

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import MedicalReport


from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import MedicalReport


class ReportHistoryView(APIView):

    def get(self, request):
        reports = MedicalReport.objects.order_by("-uploaded_at")[:12]

        data = []
        for report in reports:
            local_time = timezone.localtime(report.uploaded_at)

            data.append({
                "id": report.id,
                "filename": report.original_filename,
                "uploaded_at": local_time.strftime(
                    "%d %b %Y, %I:%M %p"
                ),
                "final_conclusion": report.final_conclusion,
                "status": self._derive_status(report),
            })

        return Response(data)

    def _derive_status(self, report):
        if not report.comparison_table:
            return "Unknown"

        for item in report.comparison_table:
            if item.get("status") in ["High", "Low", "Abnormal"]:
                return "Attention"
        return "Normal"


class DashboardView(APIView):
    """
    Dashboard API:
    - Latest vitals (BP, Sugar, SpO2, HR)
    - Blood sugar trend (last 12 reports, one value each)
    """

    def get(self, request):
        reports = list(
            MedicalReport.objects.order_by("-uploaded_at")[:12]
        )

        if not reports:
            return Response(
                {
                    "latest_vitals": None,
                    "sugar_trend": [],
                },
                status=status.HTTP_200_OK,
            )

        latest_report = reports[0]

        latest_vitals = {
            "bp": None,
            "bp_status": None,
            "sugar": None,
            "sugar_status": None,
            "spo2": None,
            "heart_rate": None,
        }

        sugar_trend = []

        # -------------------------------------------------
        # LOOP REPORTS (newest → oldest)
        # -------------------------------------------------
        for report in reports:
            if not report.comparison_table:
                continue

            glucose_value = None
            glucose_status = None

            for item in report.comparison_table:
                vital = item.get("vital", "").lower()
                value = item.get("patient_value")
                status_ = item.get("status")

                # -----------------------------
                # Blood Pressure (latest only)
                # -----------------------------
                if "blood pressure" in vital and report.id == latest_report.id:
                    latest_vitals["bp"] = value
                    latest_vitals["bp_status"] = status_

                # -----------------------------
                # Glucose (priority based)
                # -----------------------------
                if "random" in vital:
                    glucose_value = value
                    glucose_status = status_

                elif "fasting" in vital and glucose_value is None:
                    glucose_value = value
                    glucose_status = status_

                elif "sugar" in vital and glucose_value is None:
                    glucose_value = value
                    glucose_status = status_

            # ----------------------------------
            # Save ONE glucose per report
            # ----------------------------------
            if glucose_value is not None:
                try:
                    sugar_trend.append(float(glucose_value))
                except (TypeError, ValueError):
                    pass

                if report.id == latest_report.id:
                    latest_vitals["sugar"] = glucose_value
                    latest_vitals["sugar_status"] = glucose_status

            # ----------------------------------
            # Vitals (NOT range-based)
            # ----------------------------------
            if report.id == latest_report.id and report.vitals:
                latest_vitals["spo2"] = report.vitals.get("spo2")
                latest_vitals["heart_rate"] = report.vitals.get("heart_rate")

        return Response(
            {
                "latest_vitals": latest_vitals,
                "sugar_trend": sugar_trend[::-1],  # oldest → latest
            },
            status=status.HTTP_200_OK,
        )
