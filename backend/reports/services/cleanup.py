import os
from django.conf import settings
from reports.models import MedicalReport


MAX_REPORTS = 12


def cleanup_old_reports():
    """
    Keeps only latest MAX_REPORTS reports.
    Deletes DB records and related files for older reports.
    """

    reports = MedicalReport.objects.order_by("-uploaded_at")

    # Reports to delete
    old_reports = reports[MAX_REPORTS:]

    for report in old_reports:
        # 1️⃣ Delete uploaded file
        if report.file and os.path.isfile(report.file.path):
            os.remove(report.file.path)

        # 2️⃣ Delete generated summary PDF
        summary_pdf = os.path.join(
            settings.MEDIA_ROOT,
            f"report_summary_{report.id}.pdf"
        )
        if os.path.isfile(summary_pdf):
            os.remove(summary_pdf)

        # 3️⃣ Delete DB record
        report.delete()
