from pathlib import Path
from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import MedicalReport
from .services.text_extractor import extract_text
from .services.text_normalizer import normalize_text
from .services.patient_extractor import extract_patient_details
from .services.vitals_extractor import extract_vitals
from .services.vitals_comparator import compare_vitals
from .services.observation_engine import generate_observations
from .services.conclusion_engine import generate_conclusion
from .services.pdf_generator import generate_summary_pdf
from .services.cleanup import cleanup_old_reports


class UploadReportView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    MAX_FILE_SIZE_MB = 10

    def post(self, request):
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

        report = MedicalReport.objects.create(
            user=request.user,
            file=file,
            original_filename=file.name,
            file_size_kb=round(file.size / 1024, 2),
        )

        raw_text = extract_text(report.file.path)
        text = normalize_text(raw_text)

        patient_details = extract_patient_details(text)
        patient_details = {
            k: v if v else "Not Available"
            for k, v in patient_details.items()
        }

        vitals = extract_vitals(text)

        comparison_table = compare_vitals(
            vitals=vitals,
            gender=patient_details.get("gender"),
        )

        observations = generate_observations(comparison_table)
        final_conclusion = generate_conclusion(comparison_table)

        report.extracted_text = text
        report.patient_details = patient_details
        report.vitals = vitals
        report.comparison_table = comparison_table
        report.key_observations = observations
        report.final_conclusion = final_conclusion
        report.save()

        cleanup_old_reports()

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

        pdf_path = Path(settings.MEDIA_ROOT) / f"report_summary_{report_id}.pdf"
        generate_summary_pdf(report, pdf_path)

        return FileResponse(
            pdf_path.open("rb"),
            as_attachment=True,
            filename=f"Medical_Report_Summary_{report_id}.pdf",
        )


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = MedicalReport.objects.filter(
            user=request.user
        ).order_by("-uploaded_at")[:12]

        data = []
        for report in reports:
            local_time = timezone.localtime(report.uploaded_at)

            data.append({
                "id": report.id,
                "filename": report.original_filename,
                "uploaded_at": local_time.strftime("%d %b %Y, %I:%M %p"),
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = list(
            MedicalReport.objects.filter(
                user=request.user
            ).order_by("-uploaded_at")[:12]
        )

        if not reports:
            return Response(
                {
                    "latest_vitals": {
                        "bp": {"value": None, "status": None},
                        "sugar": {"value": None, "status": None},
                        "spo2": {"value": None, "status": None},
                        "heart_rate": {"value": None, "status": None},
                    },
                    "sugar_trend": [],
                    "report_count": 0,
                },
                status=status.HTTP_200_OK,
            )

        latest_report = reports[0]

        latest_vitals = {
            "bp": {"value": None, "status": None},
            "sugar": {"value": None, "status": None},
            "spo2": {"value": None, "status": None},
            "heart_rate": {"value": None, "status": None},
        }

        sugar_trend = []

        for report in reports:
            comparison = report.comparison_table or []

            glucose_value = None
            glucose_status = None

            for item in comparison:
                vital = (item.get("vital") or "").lower()
                value = item.get("patient_value")
                status_ = item.get("status")

                if report == latest_report and "blood pressure" in vital:
                    latest_vitals["bp"]["value"] = value
                    latest_vitals["bp"]["status"] = status_

                if "random" in vital:
                    glucose_value, glucose_status = value, status_
                elif "fasting" in vital and glucose_value is None:
                    glucose_value, glucose_status = value, status_
                elif "sugar" in vital and glucose_value is None:
                    glucose_value, glucose_status = value, status_

            if glucose_value is not None:
                try:
                    sugar_trend.append(float(glucose_value))
                except (TypeError, ValueError):
                    pass

                if report == latest_report:
                    latest_vitals["sugar"]["value"] = glucose_value
                    latest_vitals["sugar"]["status"] = glucose_status

            if report == latest_report and isinstance(report.vitals, dict):
                if report.vitals.get("spo2") is not None:
                    latest_vitals["spo2"]["value"] = report.vitals.get("spo2")
                if report.vitals.get("heart_rate") is not None:
                    latest_vitals["heart_rate"]["value"] = report.vitals.get("heart_rate")

        return Response(
            {
                "latest_vitals": latest_vitals,
                "sugar_trend": sugar_trend[::-1],
                "report_count": len(reports),
            },
            status=status.HTTP_200_OK,
        )
