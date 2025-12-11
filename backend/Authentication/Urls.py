from django.urls import path
from .views import google_login, get_user_data

urlpatterns = [
    path("google/", google_login),
    path("me/", get_user_data),
]
