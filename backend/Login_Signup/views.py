from .models import Profile, Status, PasswordResetOTP, ChatSession, ChatMessage
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, logout
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
import random
import hashlib
import json
import logging
from .Services import func_workout, diet_by_bmi

logger = logging.getLogger(__name__)

OTP_RESEND_COOLDOWN_SECONDS = 60

def logout_view(request):
    logout(request)
    return redirect("/login/")

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def Signup(request):
    if request.method == "OPTIONS":
        return JsonResponse({"detail": "OK"})

    try:
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not username or not email or not password:
            return JsonResponse({"success": False}, status=400)

        validate_email(email)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"success": False}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        Profile.objects.create(user=user)
        Status.objects.create(user=user)

        return JsonResponse({
            "success": True,
            "tokens": get_tokens_for_user(user),
            "user": {
                "username": user.username,
                "email": user.email
            }
        }, status=201)

    except Exception:
        return JsonResponse({"success": False}, status=500)

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def Login(request):
    if request.method == "OPTIONS":
        return JsonResponse({"detail": "OK"})

    try:
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        password = data.get("password", "")

        user = authenticate(username=username, password=password)
        if not user:
            return JsonResponse({"success": False}, status=401)

        status_obj, _ = Status.objects.get_or_create(user=user)

        return JsonResponse({
            "success": True,
            "tokens": get_tokens_for_user(user),
            "user": {
                "username": user.username,
                "email": user.email,
                "profile_completed": status_obj.profile_completed
            }
        })

    except Exception:
        return JsonResponse({"success": False}, status=500)

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def forgot_password(request):
    if request.method == "OPTIONS":
        return JsonResponse({"detail": "OK"})

    try:
        data = json.loads(request.body)
        email = (data.get("email") or "").strip()
        if not email:
            return JsonResponse({"success": True, "otp_sent": False})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"success": True, "otp_sent": False})

        last_otp = PasswordResetOTP.objects.filter(user=user).order_by("-created_at").first()
        if last_otp:
            elapsed = (timezone.now() - last_otp.created_at).total_seconds()
            if elapsed < OTP_RESEND_COOLDOWN_SECONDS and not last_otp.is_expired():
                return JsonResponse({"success": True, "otp_sent": False})

        PasswordResetOTP.objects.filter(user=user).delete()

        raw_otp = f"{random.randint(100000, 999999):06d}"
        hashed_otp = hashlib.sha256(raw_otp.encode()).hexdigest()

        PasswordResetOTP.objects.create(user=user, otp=hashed_otp)

        try:
            send_mail(
                "Password Reset OTP",
                f"Your OTP is {raw_otp}. It will expire in 10 minutes.",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception:
            PasswordResetOTP.objects.filter(user=user).delete()
            return JsonResponse({"success": True, "otp_sent": False})

        return JsonResponse({"success": True, "otp_sent": True})

    except Exception:
        return JsonResponse({"success": False}, status=500)

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def reset_password(request):
    if request.method == "OPTIONS":
        return JsonResponse({"detail": "OK"})

    try:
        data = json.loads(request.body)
        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("new_password")

        user = User.objects.get(email=email)
        otp_obj = PasswordResetOTP.objects.filter(user=user).latest("created_at")

        if otp_obj.is_expired():
            otp_obj.delete()
            return JsonResponse({"success": False}, status=400)

        if otp_obj.attempts >= 3:
            otp_obj.delete()
            return JsonResponse({"success": False}, status=400)

        if hashlib.sha256(otp.encode()).hexdigest() != otp_obj.otp:
            otp_obj.attempts += 1
            otp_obj.save()
            return JsonResponse({"success": False}, status=400)

        validate_password(new_password, user)

        user.set_password(new_password)
        user.save()
        otp_obj.delete()

        return JsonResponse({"success": True})

    except Exception:
        return JsonResponse({"success": False}, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def Profile_creation(request):
    try:
        profile, _ = Profile.objects.get_or_create(user=request.user)

        profile.name = request.data.get("name")
        profile.age = request.data.get("age")
        profile.gender = request.data.get("gender")
        
        weight = request.data.get("weight")
        height = request.data.get("height")
        
        profile.weight = float(weight) if weight else None
        profile.height = float(height) if height else None
        profile.bloodgroup = request.data.get("bloodgroup")
        profile.allergies = request.data.get("allergies")

        profile.save()

        status_obj, _ = Status.objects.get_or_create(user=request.user)
        status_obj.profile_completed = True
        status_obj.save()

        return JsonResponse({
            "success": True,
            "msg": "Profile created successfully",
            "profile_completed": True
        })
        
    except ValueError as e:
        logger.error(f"Invalid data type: {str(e)}")
        return JsonResponse({
            "success": False, 
            "msg": "Invalid weight or height format"
        }, status=400)
        
    except Exception as e:
        logger.error(f"Profile creation error: {str(e)}")
        return JsonResponse({
            "success": False, 
            "msg": "Failed to create profile"
        }, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def Send_Profile(request):
    profile = Profile.objects.get(user=request.user)

    return JsonResponse({
        "success": True,
        "username": request.user.username,
        "email": request.user.email,
        "name": profile.name,
        "age": profile.age,
        "gender": profile.gender,
        "weight": profile.weight,
        "height": profile.height,
        "bloodgroup": profile.bloodgroup,
        "allergies": profile.allergies
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def Status_view(request):
    status_obj, _ = Status.objects.get_or_create(user=request.user)

    if request.method == "POST":
        value = request.data.get("profile_completed")
        if value is None:
            return JsonResponse(
                {"success": False, "msg": "profile_completed required"},
                status=400
            )

        status_obj.profile_completed = bool(value)
        status_obj.save()

        return JsonResponse({
            "success": True,
            "profile_completed": status_obj.profile_completed
        })

    return JsonResponse({
        "success": True,
        "profile_completed": status_obj.profile_completed
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def Smart_Help(request):
    """Endpoint for AI-driven workout and diet suggestions."""
    know = request.data.get("know")

    try:
        if know == "workout":
            level = request.data.get("Workoutlevel")
            
            if not level :
                return JsonResponse({"success": False, "msg": "Level and Type are required"}, status=400)
            
            result = func_workout(level)

        elif know == "diet":
            bmi = request.data.get("bmi")
            if not bmi:
                return JsonResponse({"success": False, "msg": "BMI is required"}, status=400)
            
            result = diet_by_bmi(float(bmi))

        else:
            return JsonResponse({"success": False, "msg": "Invalid service category"}, status=400)

        if not result["success"]:
            return JsonResponse(result, status=502)

        return JsonResponse({"success": True, "type": know, "data": result["data"]})

    except (ValueError, TypeError):
        return JsonResponse({"success": False, "msg": "Invalid data types provided"}, status=400)
    except Exception as e:
        logger.critical(f"UNHANDLED VIEW ERROR: {str(e)}")
        return JsonResponse({"success": False, "msg": "Internal Server Error"}, status=500)