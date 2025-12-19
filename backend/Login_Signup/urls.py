from django.urls import path
from . import views

urlpatterns = [
    # -------- AUTH --------
    path("signup/", views.Signup, name="signup"),
    path("login/", views.Login, name="login"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("reset-password/", views.reset_password, name="reset_password"),

    # -------- PROFILE --------
    path("profile/create/", views.Profile_creation, name="profile_create"),
    path("profile/get/", views.Send_Profile, name="profile_get"),
    path("profile/status/", views.Status_view, name="profile_status"),

    # -------- CHAT --------
    path("chats/", views.get_chats, name="get_chats"),
    path("chats/<int:chat_id>/messages/", views.get_messages, name="get_messages"),

]
