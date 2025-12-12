from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from APIAUTH.views import UserCreate, google_login_callback, validate_google_token, UserDetailView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Auth
    path('api/user/register', UserCreate.as_view(), name='user_create'),
    path('api/token', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api-auth/', include('rest_framework.urls')),
    path('api/auth/user', UserDetailView.as_view(), name='user_detail'),
    path('api/google/validate_token', validate_google_token, name='validate_token'),

    # YOUR APIAUTH URLs
    path('accounts/', include('APIAUTH.urls')),

    # ⭐ GOOGLE LOGIN URLs FROM ALLAUTH
    path('accounts/', include('allauth.urls')),  # <-- THIS FIXES THE 404

    # Custom callback
    path('callback/', google_login_callback, name='callback'),
]
