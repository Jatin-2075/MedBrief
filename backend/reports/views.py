import logging
import os
import tempfile
from typing import Any, Dict, List, Optional, Union

from django.conf import settings
from django.core.files import File
from django.db import transaction
from django.http import FileResponse, Http404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MedicalReport
from .services.cleanup_report import cleanup_old_reports
from .services.conclusion_engine import generate_conclusion
from .services.observation_engine import generate_observations
from .services.patient_extractor import extract_patient_details
from .services.pdf_generator import generate_summary_pdf
from .services.text_extractor import extract_text
from .services.text_normalizer import normalize_text
from .services.vitals_comparator import compare_vitals
from .services.vitals_extractor import extract_vitals

logger = logging.getLogger(__name__)


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            return float(value)
        return None
    except (ValueError, TypeError):
        return None


def _safe_str(value: Any) -> Optional[str]:
    try:
        if value is None:
            return None
        if isinstance(value, str):
            s = value.strip()
            return s if s else None
        return str(value)
    except Exception:
        return None


def _is_allowed_extension(filename: str, allowed: List[str]) -> bool:
    name = (filename or "").lower()
    return any(name.endswith(ext) for ext in allowed)


def _json_safe_dict(d: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(d, dict):
        return {}
    safe: Dict[str, Any] = {}
    for k, v in d.items():
        key = str(k)
        if isinstance(v, (str, int, float, bool)) or v is None:
            safe[key] = v
        elif isinstance(v, (list, tuple)):
            safe[key] = list(v)
        elif isinstance(v, dict):
            safe[key] = _json_safe_dict(v)
        else:
            safe[key] = _safe_str(v)
    return safe


def _json_safe_list(lst: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    if not isinstance(lst, list):
        return []
    return [_json_safe_dict(x if isinstance(x, dict) else {}) for x in lst]


@method_decorator(csrf_exempt, name="dispatch")
class UploadReportView(APIView):
    permission_classes = [IsAuthenticated]
    ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    MAX_FILE_SIZE_MB = 10

    def post(self, request):
        file = request.FILES.get("report")
        if not file:
            return Response({"error": "No report file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Validation: size
        try:
            size_ok = file.size <= self.MAX_FILE_SIZE_MB * 1024 * 1024
        except Exception:
            size_ok = False
        if not size_ok:
            return Response(
                {"error": f"File size exceeds {self.MAX_FILE_SIZE_MB}MB limit"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validation: extension
        filename = getattr(file, "name", "") or ""
        if not _is_allowed_extension(filename, self.ALLOWED_EXTENSIONS):
            return Response({"error": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)

        # Initial record creation inside transaction to avoid partial writes
        try:
            with transaction.atomic():
                report = MedicalReport.objects.create(
                    user=request.user,
                    file=file,
                    original_filename=filename,
                    file_size_kb=round((getattr(file, "size", 0) or 0) / 1024.0, 2),
                )
        except Exception as e:
            logger.error(f"Failed to create MedicalReport: {e}", exc_info=True)
            return Response({"error": "Failed to create report record"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Processing pipeline
        try:
            # Extract and normalize text
            raw_text = ""
            try:
                raw_text = extract_text(getattr(report.file, "path", None))
            except Exception as e:
                logger.warning(f"Text extraction failed for report {report.id}: {e}", exc_info=True)

            text = ""
            try:
                text = normalize_text(raw_text or "")
            except Exception as e:
                logger.warning(f"Text normalization failed for report {report.id}: {e}", exc_info=True)
                text = raw_text or ""

            # Patient details
            patient_details: Dict[str, Any] = {}
            try:
                pd = extract_patient_details(text or "")
                if isinstance(pd, dict):
                    patient_details = {k: (v if _safe_str(v) else None) for k, v in pd.items()}
                else:
                    patient_details = {}
            except Exception as e:
                logger.warning(f"Patient details extraction failed for report {report.id}: {e}", exc_info=True)
                patient_details = {}

            # Ensure defaults
            for key in ("name", "age", "gender", "height", "weight"):
                patient_details[key] = patient_details.get(key) or None

            # Vitals extraction
            vitals: Dict[str, Any] = {}
            try:
                vt = extract_vitals(text or "")
                vitals = vt if isinstance(vt, dict) else {}
            except Exception as e:
                logger.warning(f"Vitals extraction failed for report {report.id}: {e}", exc_info=True)
                vitals = {}

            # Comparison table
            comparison_table: List[Dict[str, Any]] = []
            try:
                comparison_table = compare_vitals(
                    vitals=vitals,
                    gender=(patient_details.get("gender") or None),
                )
                if not isinstance(comparison_table, list):
                    comparison_table = []
            except Exception as e:
                logger.warning(f"Vitals comparison failed for report {report.id}: {e}", exc_info=True)
                comparison_table = []

            # Logic engines
            observations: List[str] = []
            try:
                obs = generate_observations(comparison_table)
                if isinstance(obs, list):
                    observations = [str(x) for x in obs]
                elif isinstance(obs, str):
                    observations = [obs]
                else:
                    observations = []
            except Exception as e:
                logger.warning(f"Observation generation failed for report {report.id}: {e}", exc_info=True)
                observations = []

            final_conclusion: Optional[str] = None
            try:
                fc = generate_conclusion(comparison_table)
                final_conclusion = _safe_str(fc)
            except Exception as e:
                logger.warning(f"Conclusion generation failed for report {report.id}: {e}", exc_info=True)
                final_conclusion = None

            # Calculated fields
            bmi = self._calculate_bmi(vitals, patient_details)
            respiratory_rate = self._extract_rr(vitals)

            # Persist results
            try:
                report.extracted_text = text or ""
                report.patient_details = _json_safe_dict(patient_details)
                report.vitals = _json_safe_dict(vitals)
                report.comparison_table = _json_safe_list(comparison_table)
                report.key_observations = observations
                report.final_conclusion = final_conclusion
                report.bmi = bmi
                report.respiratory_rate = respiratory_rate
                report.save()
            except Exception as e:
                logger.error(f"Failed to save processed report {report.id}: {e}", exc_info=True)
                return Response({"error": "Failed to save report data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # PDF generation
            self._handle_pdf_generation(report)

            # Background cleanup (best-effort)
            try:
                cleanup_old_reports(request.user)
            except Exception as e:
                logger.warning(f"Cleanup old reports failed for user {request.user.id}: {e}")

            return Response(
                {
                    "message": "Report processed successfully",
                    "report_id": report.id,
                    "bmi": bmi,
                    "respiratory_rate": respiratory_rate,
                    "final_conclusion": final_conclusion,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error(f"Critical error processing report {report.id}: {e}", exc_info=True)
            return Response({"error": "An error occurred during report processing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _calculate_bmi(self, vitals: Dict[str, Any], patient_details: Dict[str, Any]) -> Optional[float]:
        try:
            # Direct BMI
            bmi_val = vitals.get("bmi")
            bmi_f = _safe_float(bmi_val)
            if bmi_f is not None and bmi_f > 0:
                return round(bmi_f, 1)

            # Fallback: weight/height
            weight = _safe_float(patient_details.get("weight"))
            height_cm = _safe_float(patient_details.get("height"))
            if weight is None or height_cm is None or height_cm <= 0:
                return None
            height_m = height_cm / 100.0
            if height_m <= 0:
                return None
            bmi_calc = weight / (height_m ** 2)
            if bmi_calc <= 0 or bmi_calc != bmi_calc:  # NaN check
                return None
            return round(bmi_calc, 1)
        except Exception:
            return None

    def _extract_rr(self, vitals: Dict[str, Any]) -> Optional[float]:
        try:
            rr_value = vitals.get("respiratory_rate")
            rr = _safe_float(rr_value)
            return rr if (rr is not None and rr > 0) else None
        except Exception:
            return None

    def _handle_pdf_generation(self, report: MedicalReport) -> None:
        tmp_name = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp_name = tmp.name
            try:
                generate_summary_pdf(report, tmp_name)
            except Exception as e:
                logger.error(f"PDF generation failed for report {report.id}: {e}", exc_info=True)
                return

            if not tmp_name or not os.path.exists(tmp_name):
                logger.error(f"PDF temp file missing for report {report.id}")
                return

            try:
                with open(tmp_name, "rb") as pdf_file:
                    report.summary_pdf.save(
                        f"Medical_Report_Summary_{report.id}.pdf",
                        File(pdf_file),
                        save=True,
                    )
            except Exception as e:
                logger.error(f"Saving PDF to model failed for report {report.id}: {e}", exc_info=True)
            finally:
                try:
                    os.unlink(tmp_name)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {tmp_name}: {e}")
        except Exception as e:
            logger.error(f"PDF generation block failed for report {report.id}: {e}", exc_info=True)
            if tmp_name:
                try:
                    os.unlink(tmp_name)
                except Exception:
                    pass


class DownloadReportPDF(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id: Union[int, str]):
        try:
            report = MedicalReport.objects.get(id=report_id, user=request.user)
        except MedicalReport.DoesNotExist:
            raise Http404("Report not found")
        except Exception as e:
            logger.error(f"Error fetching report {report_id}: {e}", exc_info=True)
            raise Http404("Report not found")

        if not getattr(report, "summary_pdf", None):
            raise Http404("PDF not available")

        try:
            file_field = report.summary_pdf
            if not file_field or not file_field.name:
                raise Http404("PDF not available")
            return FileResponse(
                file_field.open("rb"),
                as_attachment=True,
                filename=os.path.basename(file_field.name),
            )
        except FileNotFoundError:
            raise Http404("PDF file missing")
        except Exception as e:
            logger.error(f"Error returning PDF for report {report.id}: {e}", exc_info=True)
            raise Http404("PDF not available")


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    MAX_REPORTS = 6

    def get(self, request):
        try:
            reports = (
                MedicalReport.objects.filter(user=request.user)
                .order_by("-uploaded_at")[:self.MAX_REPORTS]
            )
        except Exception as e:
            logger.error(f"Error fetching report history for user {request.user.id}: {e}", exc_info=True)
            return Response([], status=status.HTTP_200_OK)

        data = []
        for report in reports:
            try:
                local_time = timezone.localtime(report.uploaded_at)
                summary_available = bool(getattr(report, "summary_pdf", None))
                data.append({
                    "id": report.id,
                    "filename": report.original_filename,
                    "uploaded_at": local_time.strftime("%d %b %Y, %I:%M %p"),
                    "final_conclusion": report.final_conclusion,
                    "status": self._derive_status(report),
                    "summary_pdf_url": (
                        request.build_absolute_uri(f"/api/reports/{report.id}/download/")
                        if summary_available else None
                    ),
                    "has_pdf": summary_available,
                })
            except Exception as e:
                logger.warning(f"Failed to serialize report {getattr(report, 'id', 'unknown')}: {e}", exc_info=True)
        return Response(data, status=status.HTTP_200_OK)

    def _derive_status(self, report: MedicalReport) -> str:
        try:
            table = getattr(report, "comparison_table", None)
            if not table or not isinstance(table, list):
                return "Unknown"
            critical_keywords = {"High", "Low", "Abnormal"}
            for item in table:
                status_val = (item or {}).get("status")
                if isinstance(status_val, str) and status_val in critical_keywords:
                    return "Attention"
            return "Normal"
        except Exception:
            return "Unknown"


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    MAX_REPORTS = 6

    def get(self, request):
        try:
            reports = list(
                MedicalReport.objects.filter(user=request.user)
                .order_by("-uploaded_at")[:self.MAX_REPORTS]
            )
        except Exception as e:
            logger.error(f"Error fetching dashboard data for user {request.user.id}: {e}", exc_info=True)
            return Response({"latest_vitals": None, "bmi_trend": []}, status=status.HTTP_200_OK)

        if not reports:
            return Response({"latest_vitals": None, "bmi_trend": []}, status=status.HTTP_200_OK)

        latest = reports[0]

        latest_vitals = {
            "bp": None,
            "bp_status": None,
            "bmi": latest.bmi if isinstance(latest.bmi, (int, float)) else None,
            "respiratory_rate": latest.respiratory_rate if isinstance(latest.respiratory_rate, (int, float)) else None,
            "heart_rate": None,
            "raw_vitals": getattr(latest, "vitals", None),
        }

        try:
            if isinstance(latest.vitals, dict):
                hr = latest.vitals.get("heart_rate")
                latest_vitals["heart_rate"] = _safe_float(hr)
        except Exception:
            latest_vitals["heart_rate"] = None

        try:
            table = getattr(latest, "comparison_table", None)
            if table and isinstance(table, list):
                for item in table:
                    vital_name = _safe_str((item or {}).get("vital"))
                    if vital_name and "blood pressure" in vital_name.lower():
                        latest_vitals["bp"] = (item or {}).get("patient_value")
                        latest_vitals["bp_status"] = (item or {}).get("status")
                        break
        except Exception as e:
            logger.warning(f"Failed to extract BP from comparison table for report {latest.id}: {e}", exc_info=True)

        bmi_trend: List[Optional[float]] = []
        try:
            bmi_trend = [
                r.bmi for r in reversed(reports)
                if isinstance(getattr(r, "bmi", None), (int, float))
            ]
        except Exception:
            bmi_trend = []

        return Response({"latest_vitals": latest_vitals, "bmi_trend": bmi_trend}, status=status.HTTP_200_OK)