from django.urls import path
from .views import UserCreate, google_login_callback, validate_google_token, UserDetailView

urlpatterns = [
    path('register/', UserCreate.as_view(), name='user_create'),
    path('callback/', google_login_callback, name='callback'),
    path('validate_token/', validate_google_token, name='validate_token'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
]
