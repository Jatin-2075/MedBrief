from django.db import models


class MedicalReport(models.Model):
    file = models.FileField(upload_to="reports/")
    original_filename = models.CharField(max_length=255)
    file_size_kb = models.FloatField()

    extracted_text = models.TextField(blank=True, null=True)

    patient_details = models.JSONField(blank=True, null=True)
    vitals = models.JSONField(blank=True, null=True)

    comparison_table = models.JSONField(blank=True, null=True)
    key_observations = models.JSONField(blank=True, null=True)
    final_conclusion = models.TextField(blank=True, null=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename
