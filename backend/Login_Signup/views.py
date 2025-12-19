from .models import Profile, Status, ChatSession, ChatMessage, PasswordResetOTP
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import random
import hashlib
import json


def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@csrf_exempt
@require_POST
def Signup(request):
    try:
        # Parse JSON body
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        # Validation
        if not username or not email or not password:
            return JsonResponse({'success': False, 'msg': 'All fields are required'}, status=400)

        if len(username) < 3:
            return JsonResponse({'success': False, 'msg': 'Username must be at least 3 characters'}, status=400)

        if len(password) < 8:
            return JsonResponse({'success': False, 'msg': 'Password must be at least 8 characters'}, status=400)

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'success': False, 'msg': 'Invalid email format'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, 'msg': 'Username already exists'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'msg': 'Email already registered'}, status=400)

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Create profile and status
        Profile.objects.create(user=user)
        Status.objects.create(user=user)

        # Generate tokens
        tokens = get_tokens_for_user(user)

        return JsonResponse({
            'success': True,
            'msg': 'Account created successfully',
            'tokens': tokens,
            'user': {
                'username': user.username,
                'email': user.email
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'msg': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Server error occurred'}, status=500)


@csrf_exempt
@require_POST
def Login(request):
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return JsonResponse({'success': False, 'msg': 'Username and password required'}, status=400)

        user = authenticate(username=username, password=password)

        if user is not None:
            tokens = get_tokens_for_user(user)
            
            # Get profile status
            try:
                status_obj = Status.objects.get(user=user)
                profile_complete = status_obj.status
            except Status.DoesNotExist:
                Status.objects.create(user=user)
                profile_complete = False

            return JsonResponse({
                'success': True,
                'msg': 'Login successful',
                'tokens': tokens,
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'profile_complete': profile_complete
                }
            })
        else:
            return JsonResponse({'success': False, 'msg': 'Invalid credentials'}, status=401)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'msg': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Server error occurred'}, status=500)


@csrf_exempt
@require_POST
def forgot_password(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip()

        # Always return success to prevent email enumeration
        response = {
            "success": True,
            "msg": "If the email exists, an OTP has been sent."
        }

        if not email:
            return JsonResponse(response, status=200)

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(response, status=200)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse(response, status=200)

        # Remove old OTPs
        PasswordResetOTP.objects.filter(user=user).delete()

        # Generate OTP
        raw_otp = str(random.randint(100000, 999999))
        hashed_otp = hashlib.sha256(raw_otp.encode()).hexdigest()

        PasswordResetOTP.objects.create(user=user, otp=hashed_otp)

        # Send email
        send_mail(
            subject="SmartZen Password Reset OTP",
            message=f"Your OTP is {raw_otp}. It is valid for 10 minutes.",
            from_email=None,
            recipient_list=[email],
            fail_silently=True
        )

        return JsonResponse(response, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "msg": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"success": True, "msg": "If the email exists, an OTP has been sent."}, status=200)


@csrf_exempt
@require_POST
def reset_password(request):
    try:
        data = json.loads(request.body)
        email = data.get("email", "").strip()
        otp = data.get("otp", "").strip()
        new_password = data.get("new_password", "")

        if not email or not otp or not new_password:
            return JsonResponse({"success": False, "msg": "All fields are required"}, status=400)

        if len(new_password) < 8:
            return JsonResponse({"success": False, "msg": "Password must be at least 8 characters"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "msg": "Invalid OTP or email"}, status=400)

        try:
            otp_record = PasswordResetOTP.objects.filter(user=user).latest("created_at")
        except PasswordResetOTP.DoesNotExist:
            return JsonResponse({"success": False, "msg": "OTP not found or expired"}, status=400)

        # Check expiry
        if otp_record.is_expired():
            otp_record.delete()
            return JsonResponse({"success": False, "msg": "OTP expired"}, status=400)

        # Limit attempts
        if otp_record.attempts >= 3:
            otp_record.delete()
            return JsonResponse({"success": False, "msg": "Too many incorrect attempts"}, status=400)

        # Verify OTP
        hashed_input = hashlib.sha256(otp.encode()).hexdigest()

        if hashed_input != otp_record.otp:
            otp_record.attempts += 1
            otp_record.save()
            return JsonResponse({"success": False, "msg": "Invalid OTP"}, status=400)

        # Reset password
        user.set_password(new_password)
        user.save()

        # Remove OTP
        PasswordResetOTP.objects.filter(user=user).delete()

        return JsonResponse({"success": True, "msg": "Password reset successful"}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "msg": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "msg": "Server error occurred"}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def Profile_creation(request):
    try:
        profile, _ = Profile.objects.get_or_create(user=request.user)

        # Update profile fields
        profile.name = request.data.get("name", "").strip() or None
        profile.age = request.data.get("age") or None
        profile.gender = request.data.get("gender", "").strip() or None
        profile.weight = request.data.get("weight") or None
        profile.height = request.data.get("height") or None
        profile.bloodgroup = request.data.get("bloodgroup", "").strip() or None
        profile.allergies = request.data.get("allergies", "").strip() or None

        # Validate age
        if profile.age and (profile.age < 0 or profile.age > 150):
            return JsonResponse({'success': False, 'msg': 'Invalid age'}, status=400)

        profile.save()

        # Update status
        status_obj, _ = Status.objects.get_or_create(user=request.user)
        status_obj.status = True
        status_obj.save()

        return JsonResponse({'success': True, 'msg': 'Profile created successfully'})

    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Error saving profile'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def Send_Profile(request):
    try:
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

    except Profile.DoesNotExist:
        return JsonResponse({'success': False, 'msg': 'Profile not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Error retrieving profile'}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def Status_view(request):
    try:
        status_obj, _ = Status.objects.get_or_create(user=request.user)
        
        if request.method == "POST":
            status_value = request.data.get("status")
            if status_value is not None:
                status_obj.status = bool(status_value)
                status_obj.save()
                return JsonResponse({
                    "success": True,
                    "msg": "Status updated",
                    "status": status_obj.status
                })
            else:
                return JsonResponse({'success': False, 'msg': 'Status field required'}, status=400)

        return JsonResponse({"success": True, "status": status_obj.status})

    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Error processing status'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chats(request):
    try:
        sessions = ChatSession.objects.filter(user=request.user).order_by("-created_at")[:20]

        data = [
            {
                "id": session.id,
                "title": session.title,
                "created_at": session.created_at.isoformat()
            }
            for session in sessions
        ]

        return JsonResponse({"success": True, "chats": data})

    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Error retrieving chats'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, chat_id):
    try:
        # Verify session belongs to user
        try:
            session = ChatSession.objects.get(id=chat_id, user=request.user)
        except ChatSession.DoesNotExist:
            return JsonResponse({'success': False, 'msg': 'Chat not found'}, status=404)

        messages = ChatMessage.objects.filter(session=session).order_by("created_at")

        data = [
            {
                "role": msg.role,
                "text": msg.text,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]

        return JsonResponse({"success": True, "messages": data})

    except Exception as e:
        return JsonResponse({'success': False, 'msg': 'Error retrieving messages'}, status=500)


def health(request):
    """Health check endpoint"""
    return JsonResponse({"status": "backend running", "success": True})