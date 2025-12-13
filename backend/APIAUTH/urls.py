from django.urls import path
from .views import (
    UserCreate,
    google_login_callback,
    validate_google_token,
    UserDetailView,
    summarize_report,
    report_history,
)

urlpatterns = [
    path('register/', UserCreate.as_view()),
    path('google/', validate_google_token),
    path('callback/', google_login_callback),
    path('user/', UserDetailView.as_view()),

    # 🔥 ML endpoints
    path('summarize_report/', summarize_report),
    path('report_history/', report_history),
]
