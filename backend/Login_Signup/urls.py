from django.urls import path
from . import views

urlpatterns = [

    path("signup/", views.Signup, name="signup"),
    path("login/", views.Login, name="login"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("reset-password/", views.reset_password, name="reset_password"),

    path("profile/create/", views.Profile_creation, name="profile_create"),
    path("profile/get/", views.Send_Profile, name="profile_get"),
    path("profile/status/", views.Status_view, name="profile_status"),


    path("Smart_Help/", views.Smart_Help)

]
