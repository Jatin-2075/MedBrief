from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
import uuid


# ---------------- PROFILE ----------------
class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )

    photo = models.ImageField(
        upload_to="profile_pics/",
        null=True,
        blank=True
    )

    name = models.CharField(max_length=50, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    bloodgroup = models.CharField(max_length=10, null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.user.username


# ---------------- STATUS ----------------
class Status(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="status_record"
    )

    profile_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.profile_completed}"


# ---------------- PASSWORD RESET OTP ----------------
class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=128)  # hashed OTP
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=now)

    class Meta:
        get_latest_by = "created_at"

    def is_expired(self):
        return (now() - self.created_at).total_seconds() > 600  # 10 min


# ---------------- CHAT SESSION ----------------
class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="New Chat")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"


# ---------------- CHAT MESSAGE ----------------
class ChatMessage(models.Model):
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    role = models.CharField(
        max_length=10,
        choices=[("user", "User"), ("assistant", "Assistant")]
    )

    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.text[:30]}"
