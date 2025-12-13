from django.urls import path
from .views import (
    
    summarize_report,
    report_history,
)

urlpatterns = [
    # 🔥 ML endpoints
    path('summarize_report/', summarize_report),
    path('report_history/', report_history),
]
