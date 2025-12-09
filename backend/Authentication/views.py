from .models import Profile
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout

def Signup(request):
    if request.method == 'POST':
        Email = request.POST.get("Email")
        Password = request.POST.get("Password")

        if User.objects.filter(username=Email).exists():
            return JsonResponse({'success' : False, 'msg' : 'Email already present'})

        my_user = User.objects.create_user(username=Email ,email=Email, password=Password)
        Profile.objects.create(user=my_user)

        return JsonResponse({'success' : True, 'msg' : 'Account Created'})

    return JsonResponse({ 'success' : False ,'msg' : 'Error try again'})


def Login(request):
    if request.method == 'POST':
        Email = request.POST.get('Email')
        Password = request.POST.get('Password')

        user = authenticate(username = Email, password = Password)

        if user is not None:
            login(request, user)
            return JsonResponse({'success' : True, 'msg' : 'Login'})
        else:
            return JsonResponse({'success' : False, 'msg' : 'Error try Again'})

    return JsonResponse({'success' : False, 'msg' : 'Error try Again'})




def Logout(request):
    if request.method == 'POST':
        logout(request)

        return JsonResponse({'success' : True, 'msg' : 'Logout complete'})

    return JsonResponse({'success' : False, 'msg': 'Logout inComplete'})