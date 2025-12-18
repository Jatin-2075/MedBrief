from .models import Profile
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import random
import hashlib
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from .models import PasswordResetOTP


@csrf_exempt
def Signup(request):
    if request.method != "POST":
        return JsonResponse({'success': False, 'msg': 'Invalid request method'})

    username = request.POST.get('username')
    email = request.POST.get('email')
    password = request.POST.get('password')

    print("METHOD:", request.method)
    print("POST DATA:", request.POST)

    if not username or not email or not password:
        return JsonResponse({'success': False, 'msg': 'All fields are required'})

    if User.objects.filter(username=username).exists():
        return JsonResponse({'success': False, 'msg': 'Username already present'})

    if User.objects.filter(email=email).exists():
        return JsonResponse({'success': False, 'msg': 'Email already present'})

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    Profile.objects.create(user=user)

    return JsonResponse({'success': True, 'msg': 'Account created'})

@csrf_exempt
def Login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        print("LOGIN DATA:", username, password)

        user = authenticate(username=username, password=password)
        print("AUTH USER:", user)

        if user is not None:
            login(request, user)
            return JsonResponse({'success' : True, 'msg' : 'logged in'})
        
        else:
            return JsonResponse({'success' : False, 'msg' : 'Somethings wrong check please'})

    else: 
        return JsonResponse ({'msg' : 'Try Again', 'success' : False})

    return JsonResponse({'success' : False, 'msg' : 'Error occurred'})

@csrf_exempt
def Logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse ({'msg' : 'Success', 'success' : True})

    return JsonResponse({'success' : False , 'msg' : 'Some Error Occurred'})

@csrf_exempt
@require_POST
def forgot_password(request):
    email = request.POST.get("email")

    # Always return success (prevents email enumeration)
    response = {
        "success": True,
        "msg": "If the email exists, an OTP has been sent."
    }

    if not email:
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

    PasswordResetOTP.objects.create(
        user=user,
        otp=hashed_otp
    )

    send_mail(
        subject="SmartZen Password Reset OTP",
        message=f"Your OTP is {raw_otp}. It is valid for 10 minutes.",
        from_email=None,
        recipient_list=[email],
    )

    return JsonResponse(response, status=200)

@csrf_exempt
@require_POST
def reset_password(request):
    email = request.POST.get("email")
    otp = request.POST.get("otp")
    new_password = request.POST.get("new_password")

    if not email or not otp or not new_password:
        return JsonResponse(
            {"success": False, "msg": "All fields are required"},
            status=400
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse(
            {"success": False, "msg": "Invalid OTP or email"},
            status=400
        )

    try:
        otp_record = PasswordResetOTP.objects.filter(
            user=user
        ).latest("created_at")
    except PasswordResetOTP.DoesNotExist:
        return JsonResponse(
            {"success": False, "msg": "OTP not found"},
            status=400
        )

    # Check expiry
    if otp_record.is_expired():
        otp_record.delete()
        return JsonResponse(
            {"success": False, "msg": "OTP expired"},
            status=400
        )

    # Limit attempts
    if otp_record.attempts >= 3:
        otp_record.delete()
        return JsonResponse(
            {"success": False, "msg": "Too many incorrect attempts"},
            status=400
        )

    # Hash input OTP
    hashed_input = hashlib.sha256(otp.encode()).hexdigest()

    if hashed_input != otp_record.otp:
        otp_record.attempts += 1
        otp_record.save()
        return JsonResponse(
            {"success": False, "msg": "Invalid OTP"},
            status=400
        )

    # Reset password
    user.set_password(new_password)
    user.save()

    # Remove OTP after success
    PasswordResetOTP.objects.filter(user=user).delete()

    return JsonResponse(
        {"success": True, "msg": "Password reset successful"},
        status=200
    )


@login_required
@csrf_exempt
def Profile_creation(request):
    if not request.user.is_authenticated:
        return JsonResponse({'msg' : 'unauthorized request if logged in try contacting developers ', 'suscess' : False}, status=401)

    if request.method == 'POST':

        profile , create= Profile.objects.get_or_create(user=request.user)

        profile.name = request.POST.get("name")
        profile.age = request.POST.get("age")
        profile.gender = request.POST.get("gender")
        profile.weight = request.POST.get("weight")
        profile.height = request.POST.get("height")
        profile.bloodgroup = request.POST.get("bloodgroup")
        profile.allergies = request.POST.get("allergies")

        profile.save()

        return JsonResponse({'msg' : 'profile created', 'success': True})

    return ({'msg' : 'something went wrong', 'success' : False})


@login_required
def Send_Profile(request):
    try:
        profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        return JsonResponse({'msg': 'Profile not found', 'success': False}, status=404)

    return JsonResponse({
        "username": request.user.username,
        "email": request.user.email,
        "name": profile.name,
        "age": profile.age,
        "gender": profile.gender,
        "weight": profile.weight,
        "height": profile.height,
        "bloodgroup": profile.bloodgroup,
        "allergies": profile.allergies,
        "success": True
    })

         