from django.urls import path
from . import views
from .views import forgot_password
from .views import reset_password



urlpatterns = [
    path("signup/", views.Signup, name="signup"),
    path("login/", views.Login, name="login"),
    path("forgot-password/", forgot_password),
    path("reset-password/", reset_password),
    path("logout/", views.Logout, name="logout"),
    


    path("Create_Profile/", views.Profile_creation, name="Create_Profile"),
    path("Send_Profile/", views.Send_Profile, name="Send_Profile")
    path("Status/", views.Status, name="Status")
]
