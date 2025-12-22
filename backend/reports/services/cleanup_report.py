from ..models import MedicalReport
import os

def cleanup_old_reports(user, keep=12):
    reports = (
        MedicalReport.objects
        .filter(user=user)
        .order_by("-uploaded_at")
    )

    old_reports = reports[keep:]

    for report in old_reports:
        if report.file and os.path.isfile(report.file.path):
            os.remove(report.file.path)
        report.delete()
