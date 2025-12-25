from pathlib import Path
import logging
import tempfile
import os

from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from .services.text_extractor import extract_text
from .services.text_normalizer import normalize_text
from .services.patient_extractor import extract_patient_details
from .services.vitals_extractor import extract_vitals
from .services.vitals_comparator import compare_vitals
from .services.observation_engine import generate_observations
from .services.conclusion_engine import generate_conclusion
from .services.pdf_generator import generate_summary_pdf
from rest_framework.permissions import IsAuthenticated
from .services.cleanup_report import cleanup_old_reports
from rest_framework.views import APIView
from rest_framework import status
from django.utils import timezone
from .models import MedicalReport
from django.core.files import File

# Add logging
logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class UploadReportView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    MAX_FILE_SIZE_MB = 10

    def post(self, request):
        file = request.FILES.get("report")
        if not file:
            return Response({"error": "No report file provided"}, status=400)

        if file.size > self.MAX_FILE_SIZE_MB * 1024 * 1024:
            return Response({"error": "File size exceeds 10 MB limit"}, status=400)

        if not any(file.name.lower().endswith(ext) for ext in self.ALLOWED_EXTENSIONS):
            return Response({"error": "Unsupported file type"}, status=400)

        report = MedicalReport.objects.create(
            user=request.user,
            file=file,
            original_filename=file.name,
            file_size_kb=round(file.size / 1024, 2),
        )

        raw_text = extract_text(report.file.path)
        text = normalize_text(raw_text)

        patient_details = extract_patient_details(text)
        patient_details = {k: v or "Not Available" for k, v in patient_details.items()}

        vitals = extract_vitals(text)
        comparison_table = compare_vitals(
            vitals=vitals,
            gender=patient_details.get("gender"),
        )

        observations = generate_observations(comparison_table)
        final_conclusion = generate_conclusion(comparison_table)

        # Calculate BMI - FIX: Specific exceptions
        bmi = None
        try:
            bmi_value = vitals.get("bmi")
            if bmi_value:
                bmi = round(float(bmi_value), 1)
        except (ValueError, TypeError):  # ✅ Fixed
            bmi = None

        if bmi is None:
            try:
                weight = float(patient_details.get("weight"))
                height_cm = float(patient_details.get("height"))
                height_m = height_cm / 100
                bmi = round(weight / (height_m ** 2), 1)
            except (ValueError, TypeError, ZeroDivisionError):  # ✅ Fixed
                bmi = None

        # Extract respiratory rate - FIX: Specific exceptions
        respiratory_rate = None
        try:
            rr_value = vitals.get("respiratory_rate")
            if rr_value:
                respiratory_rate = float(rr_value)
        except (ValueError, TypeError):  # ✅ Fixed
            respiratory_rate = None

        report.extracted_text = text
        report.patient_details = patient_details
        report.vitals = vitals
        report.comparison_table = comparison_table
        report.key_observations = observations
        report.final_conclusion = final_conclusion
        report.bmi = bmi
        report.respiratory_rate = respiratory_rate
        report.save()

        # Generate PDF with error handling
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                generate_summary_pdf(report, tmp.name)
                tmp.seek(0)
                report.summary_pdf.save(
                    f"Medical_Report_Summary_{report.id}.pdf",
                    File(tmp),
                    save=True
                )
                
                # Clean up temporary file - FIX: Specific exception + logging
                try:
                    os.unlink(tmp.name)
                except OSError as e:  # ✅ Fixed
                    logger.warning(f"Failed to delete temp file: {str(e)}")
                    
        except Exception as e:
            # FIX: Use logger instead of print
            logger.error(f"PDF generation failed for report {report.id}: {str(e)}")  # ✅ Fixed

        cleanup_old_reports(request.user)

        return Response(
            {
                "message": "Report processed successfully",
                "report_id": report.id,
                "bmi": bmi,
                "respiratory_rate": respiratory_rate,
                "final_conclusion": final_conclusion,
            },
            status=201,
        )


class DownloadReportPDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            report = MedicalReport.objects.get(
                id=report_id,
                user=request.user
            )
        except MedicalReport.DoesNotExist:
            raise Http404("Report not found")

        if not report.summary_pdf:
            raise Http404("PDF not available")

        return FileResponse(
            report.summary_pdf.open("rb"),
            as_attachment=True,
            filename=report.summary_pdf.name.split("/")[-1],
        )


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    MAX_REPORTS = 6  # ✅ Added constant

    def get(self, request):
        reports = (
            MedicalReport.objects
            .filter(user=request.user)
            .order_by("-uploaded_at")[:self.MAX_REPORTS]  # ✅ Use constant
        )

        data = []
        for report in reports:
            local_time = timezone.localtime(report.uploaded_at)
            data.append({
                "id": report.id,
                "filename": report.original_filename,
                "uploaded_at": local_time.strftime("%d %b %Y, %I:%M %p"),
                "final_conclusion": report.final_conclusion,
                "status": self._derive_status(report),
                "summary_pdf_url": (
                    request.build_absolute_uri(f"/api/reports/{report.id}/download/")
                    if report.summary_pdf else None
                ),
                "has_pdf": bool(report.summary_pdf),
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
    permission_classes = [IsAuthenticated]
    MAX_REPORTS = 6  # ✅ Added constant

    def get(self, request):
        reports = list(
            MedicalReport.objects
            .filter(user=request.user)
            .order_by("-uploaded_at")[:self.MAX_REPORTS]  # ✅ Use constant
        )

        if not reports:
            return Response(
                {
                    "latest_vitals": None,
                    "bmi_trend": [],
                },
                status=status.HTTP_200_OK,
            )

        latest_report = reports[0]

        latest_vitals = {
            "bp": None,
            "bp_status": None,
            "bmi": latest_report.bmi,
            "respiratory_rate": latest_report.respiratory_rate,
            "heart_rate": (
                latest_report.vitals.get("heart_rate")
                if latest_report.vitals else None
            ),
            "raw_vitals": latest_report.vitals,
        }

        if latest_report.comparison_table:
            for item in latest_report.comparison_table:
                vital = item.get("vital", "").lower()
                if "blood pressure" in vital:
                    latest_vitals["bp"] = item.get("patient_value")
                    latest_vitals["bp_status"] = item.get("status")

        bmi_trend = []
        for report in reversed(reports):
            if report.bmi is not None:
                bmi_trend.append(report.bmi)

        return Response(
            {
                "latest_vitals": latest_vitals,
                "bmi_trend": bmi_trend,
            },
            status=status.HTTP_200_OK,
        )