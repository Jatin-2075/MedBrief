from django.shortcuts import redirect
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from allauth.socialaccount.models import SocialToken, SocialAccount
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import json

# ===== ML / DB imports (NEW) =====
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.files import File
from .models import MedicalReport
from ML_Pipeline.pipeline import run_pipeline

user = get_user_model()

# =========================================================
# AUTH & USER MANAGEMENT (UNCHANGED)
# =========================================================

class UserCreate(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
@api_view(["POST"])
@permission_classes([AllowAny])  # TEMP for testing
def summarize_report(request):

    print("✅ summarize_report called")

    uploaded_file = request.FILES.get("file")
    print("📄 Uploaded file object:", uploaded_file)

    if not uploaded_file:
        return Response({"error": "No file uploaded"}, status=400)

    print("📄 File name:", uploaded_file.name)
    print("📄 File size:", uploaded_file.size)


@login_required
def google_login_callback(request):
    user = request.user

    social_accounts = SocialAccount.objects.filter(user=user)
    print("social account for user : ", social_accounts)

    social_account = social_accounts.first()

    if not social_account:
        return redirect('http://localhost:5173/login/callback/?error=NoSocialAccount')

    token = SocialToken.objects.filter(
        account=social_account,
        account__provider='google'
    ).first()

    if token:
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return redirect(
            f'http://localhost:5173/login/callback/?access_token={access_token}'
        )
    else:
        return redirect(
            f'http://localhost:5173/login/callback/?error=NoGoogleToken'
        )

@csrf_exempt
def validate_google_token(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            google_access_token = data.get('access_token')

            if not google_access_token:
                return JsonResponse(
                    {'detail': 'Access Token is Missing.'},
                    status=400
                )

            return JsonResponse({'valid': True})

        except json.JSONDecodeError:
            return JsonResponse({'detail': 'Invalid JSON'}, status=400)

    return JsonResponse({'detail': 'method not allowed.'}, status=405)

# =========================================================
# ML REPORT UPLOAD & SUMMARIZATION (NEW)
# =========================================================



from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.decorators import authentication_classes

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])   # 🔥 THIS disables JWT for this view
def summarize_report(request):

    """
    Accepts a PDF/DOCX file,
    runs ML pipeline,
    stores result in DB,
    returns summary JSON
    """
    try:
        summary_text, final_pdf_path = run_pipeline(
            uploaded_file.read(),
            uploaded_file.name
        )
    except Exception as e:
        return Response(
            {"error": "ML processing failed", "detail": str(e)},
            status=500
        )

    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return Response(
            {"error": "No file uploaded"},
            status=400
        )

    # 1️⃣ Run ML pipeline
    summary_text, final_pdf_path = run_pipeline(
        uploaded_file.read(),
        uploaded_file.name
    )

    # 2️⃣ Save to DB
    report = MedicalReport.objects.create(
        user=request.user,
        original_file=uploaded_file,
        summary_text=summary_text
    )


    # 3️⃣ Save generated PDF
    with open(final_pdf_path, "rb") as f:
        report.summary_pdf.save(
            f"{report.id}.pdf",
            File(f)
        )

    # 4️⃣ API response
    return Response({
    "id": report.id,
    "summary": summary_text,
    "date": report.created_at.strftime("%b %d, %Y"),
    "pdf_url": report.summary_pdf.url
})


@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def report_history(request):

    reports = MedicalReport.objects.filter(
        user=request.user
    ).order_by("-created_at")

    data = [
        {
            "id": r.id,
            "file_name": r.original_file.name.split("/")[-1],
            "date": r.created_at.strftime("%d %b %Y"),
            "summary": r.summary_text,
            "pdf_url": r.summary_pdf.url
        }
        for r in reports
    ]

    return Response(data)
