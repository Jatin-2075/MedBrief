from django.contrib import admin
from .models import MedicalReport


@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    list_display = (
        "original_filename",
        "file_size_kb",
        "uploaded_at",
        "short_conclusion",
    )

    search_fields = (
        "original_filename",
        "final_conclusion",
    )

    list_filter = ("uploaded_at",)

    readonly_fields = (
        "uploaded_at",
        "file_size_kb",
        "extracted_text",
        "patient_details",
        "vitals",
        "comparison_table",
        "key_observations",
        "final_conclusion",
    )

    ordering = ("-uploaded_at",)

    def short_conclusion(self, obj):
        return (obj.final_conclusion[:50] + "...") if obj.final_conclusion else "—"

    short_conclusion.short_description = "Conclusion"
