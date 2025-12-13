from django.contrib import admin
from .models import MedicalReport

@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "original_file",
        "created_at",
    )

    list_filter = (
        "created_at",
        "user",
    )

    search_fields = (
        "user__username",
        "original_file",
    )

    readonly_fields = (
        "created_at",
    )

    ordering = ("-created_at",)
