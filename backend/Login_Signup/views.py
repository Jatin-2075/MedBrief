from .models import Profile, Status, PasswordResetOTP, ChatSession, ChatMessage
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.timezone import now
import random
import hashlib
import json
import logging 
from .Services import func_workout, diet_by_bmi
from django.contrib.auth import logout
from django.shortcuts import redirect

def logout_view(request):
    logout(request)
    return redirect("/login/")


logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@csrf_exempt
@require_POST
def Signup(request):
    try:
        data = json.loads(request.body)

        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not username or not email or not password:
            return JsonResponse({"success": False, "msg": "All fields required"}, status=400)

        validate_email(email)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "msg": "Username exists"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"success": False, "msg": "Email exists"}, status=400)

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
        return JsonResponse({"success": False, "msg": "Server error"}, status=500)


@csrf_exempt
@require_POST
def Login(request):
    try:
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        password = data.get("password", "")

        user = authenticate(username=username, password=password)
        if not user:
            return JsonResponse({"success": False, "msg": "Invalid credentials"}, status=401)

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
        return JsonResponse({"success": False, "msg": "Server error"}, status=500)


@csrf_exempt
@require_POST
def forgot_password(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip()

        if not email:
            return JsonResponse({"success": True})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"success": True})

        # Delete old OTPs for this user
        PasswordResetOTP.objects.filter(user=user).delete()

        # Generate 6-digit OTP
        raw_otp = str(random.randint(100000, 999999))
        hashed_otp = hashlib.sha256(raw_otp.encode()).hexdigest()

        # Save hashed OTP to database
        PasswordResetOTP.objects.create(user=user, otp=hashed_otp)

        # Send email with proper configuration
        from django.conf import settings
        
        send_mail(
            subject="Password Reset OTP - MedBrief",
            message=f"Your OTP for password reset is: {raw_otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            fail_silently=False
        )
        
        logger.info(f"Password reset OTP sent to {email}")
        return JsonResponse({"success": True})

    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        return JsonResponse({"success": False})

@csrf_exempt
@require_POST
def reset_password(request):
    try:
        data = json.loads(request.body)

        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("new_password")

        user = User.objects.get(email=email)
        otp_obj = PasswordResetOTP.objects.filter(user=user).latest("created_at")

        if otp_obj.is_expired():
            otp_obj.delete()
            return JsonResponse({"success": False, "msg": "OTP expired"}, status=400)

        if otp_obj.attempts >= 3:
            otp_obj.delete()
            return JsonResponse({"success": False, "msg": "Too many attempts"}, status=400)

        if hashlib.sha256(otp.encode()).hexdigest() != otp_obj.otp:
            otp_obj.attempts += 1
            otp_obj.save()
            return JsonResponse({"success": False, "msg": "Invalid OTP"}, status=400)

        user.set_password(new_password)
        user.save()
        otp_obj.delete()

        return JsonResponse({"success": True, "msg": "Password reset done"})

    except Exception:
        return JsonResponse({"success": False, "msg": "Invalid request"}, status=400)


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