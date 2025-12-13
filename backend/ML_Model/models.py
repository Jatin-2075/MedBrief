from django.db import models
from django.conf import settings

class MedicalReport(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    original_file = models.FileField(upload_to="reports/originals/")
    summary_text = models.TextField()
    summary_pdf = models.FileField(upload_to="reports/summaries/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.id} - {self.user}"
