from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.files import File

from django.contrib.auth.decorators import login_required
from .models import MedicalReport
from ML_Pipeline.pipeline import run_pipeline


# =========================================================
# ML REPORT UPLOAD & SUMMARIZATION
# =========================================================

@api_view(["POST"])
@login_required
def summarize_report(request):
    """
    Accepts a PDF/DOCX file,
    runs ML pipeline,
    stores result in DB,
    returns summary + PDF URL
    """

    print("✅ summarize_report called")

    uploaded_file = request.FILES.get("file")
    print("📄 Uploaded file:", uploaded_file)

    if not uploaded_file:
        return Response(
            {"error": "No file uploaded"},
            status=400
        )

    try:
        # 1️⃣ Run ML pipeline
        summary_text, final_pdf_path = run_pipeline(
            uploaded_file.read(),
            uploaded_file.name
        )

    except Exception as e:
        print("❌ ML pipeline failed:", e)
        return Response(
            {"error": "ML processing failed", "detail": str(e)},
            status=500
        )

    # 2️⃣ Save report in DB
    report = MedicalReport.objects.create(
        original_file=uploaded_file,
        summary_text=summary_text
    )

    # 3️⃣ Save generated PDF
    try:
        with open(final_pdf_path, "rb") as f:
            report.summary_pdf.save(
                f"{report.id}.pdf",
                File(f)
            )
    except Exception as e:
        print("❌ PDF save failed:", e)
        return Response(
            {"error": "PDF saving failed", "detail": str(e)},
            status=500
        )

    # 4️⃣ Response
    return Response({
        "id": report.id,
        "summary": summary_text,
        "date": report.created_at.strftime("%b %d, %Y"),
        "pdf_url": report.summary_pdf.url
    })


@api_view(["GET"])
@login_required
def report_history(request):
    """
    Returns all processed reports (testing mode)
    """

    reports = MedicalReport.objects.all().order_by("-created_at")

    return Response([
        {
            "id": r.id,
            "file_name": r.original_file.name.split("/")[-1],
            "date": r.created_at.strftime("%d %b %Y"),
            "summary": r.summary_text,
            "pdf_url": r.summary_pdf.url
        }
        for r in reports
    ])
