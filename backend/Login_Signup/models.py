from django.db import models
import uuid
from django.contrib.auth.models import User
from django.utils.timezone import now

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=128)  # hashed OTP
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=now)

    def is_expired(self):
        # OTP valid for 10 minutes
        return (now() - self.created_at).seconds > 600

    def __str__(self):
        return f"{self.user.email} - OTP"



class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    name = models.CharField(max_length=50)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=20)
    weight = models.FloatField()
    height = models.FloatField()
    bloodgroup = models.CharField(max_length=10)
    allergies = models.CharField(max_length=100)

    def __str__(self):
        return self.user.username


class Create_done_not(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, on_delete=models.CASCADE,editable=False)

    status = models.BooleanField()

    def __str__(self):
        return self.user.status