from .models import Profile,Profile_done_not
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required


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

@login_required
@csrf_exempt
def Profile_creation(request):
    if request.method == 'POST':
        profile, created = Profile.objects.get_or_create(user=request.user)

        profile.name = request.POST.get("name")
        profile.age = request.POST.get("age")
        profile.gender = request.POST.get("gender")
        profile.weight = request.POST.get("weight")
        profile.height = request.POST.get("height")
        profile.bloodgroup = request.POST.get("bloodgroup")
        profile.allergies = request.POST.get("allergies")

        profile.save()

        return JsonResponse({'msg': 'Profile created', 'success': True})

    return JsonResponse({'msg': 'Invalid request', 'success': False})

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
        "success": True,
    })

@login_required
def Profile_done(request):
    if request.method != 'POST':
        return ({"msg": "Something went Wrong, ", "success": True})

    status_done, create= Profile_done_not.objects.get_or_create()
    status_done.status = request.POST.get("status")

    return JsonResponse({'msg':"Skipped", 'success': True})


@login_required
def Sent_status(request):
    return JsonResponse({
        "status":Profile_done_not.user.status,
        "success": True,
        'msg': "please create your profile later",
    })