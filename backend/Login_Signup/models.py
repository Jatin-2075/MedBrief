from django.db import models
import uuid
from django.contrib.auth.models import User
from django.utils.timezone import now

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    photo = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    name = models.CharField(max_length=50, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=50, null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    bloodgroup = models.CharField(max_length=100, null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.user.username

class Status(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="status_record")
    profile_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.profile_completed}"

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=128)  # Hashed OTP
    created_at = models.DateTimeField(default=now)

    def is_expired(self):
        # OTP valid for 10 minutes (600 seconds)
        return (now() - self.created_at).total_seconds() > 600