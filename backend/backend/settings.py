import os
import logging
import dj_database_url
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

# ======================================================
# 1. BASE CONFIGURATION & SECURITY
# ======================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# Use a default only for local development; never for production
SECRET_KEY = config("SECRET_KEY", default="django-insecure-default-key-change-this")

# Cast to bool ensures 'False' strings become False boolean
DEBUG = config("DEBUG", default=False, cast=bool)

# Support multiple hosts from .env (comma-separated)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost", cast=Csv())

RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default=None)
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# ======================================================
# 2. APPLICATION DEFINITION
# ======================================================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",  # Optimized static handling
    "django.contrib.staticfiles",

    # Third Party
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",

    # Local Apps
    "Login_Signup",
    "reports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Must be below SecurityMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
# ======================================================
# TEMPLATES (REQUIRED FOR DJANGO ADMIN)
# ======================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # optional but safe
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ROOT_URLCONF = "backend.urls"

# ======================================================
# 3. DATABASE CONFIGURATION (IN-DEPTH)
# ======================================================
# Strategy: Use PostgreSQL in prod (DATABASE_URL) and SQLite in local
DATABASES = {
    "default": config(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        cast=dj_database_url.parse
    )
}
# Performance: Persistent connections (600s) and health checks for production
DATABASES["default"]["CONN_MAX_AGE"] = 600
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# ======================================================
# 4. AUTHENTICATION & JWT (SECURE)
# ======================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated", # Default to secure
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True, # Enhanced security
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ======================================================
# 5. CORS & CSRF (CROSS-ORIGIN RESOURCE SHARING)
# ======================================================
# IMPORTANT: Vercel frontend needs explicit permission
CORS_ALLOWED_ORIGINS = [
    "https://med-brief-h1s7.vercel.app",
    "https://med-brief-nine.vercel.app", # From your notes
    "http://localhost:3000",             # Common React/Next dev port
]

CSRF_TRUSTED_ORIGINS = [
    "https://med-brief-h1s7.vercel.app",
    "https://med-brief-nine.vercel.app",
]

if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

CORS_ALLOW_CREDENTIALS = True

# ======================================================
# 6. STATIC & MEDIA (STORAGE)
# ======================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# WhiteNoise for compressed/cached static files in production
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ======================================================
# 7. EMAIL CONFIGURATION
# ======================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = f"SmartZen <{EMAIL_HOST_USER}>"

# ======================================================
# 8. PRODUCTION SECURITY CHECKLIST
# ======================================================
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_HSTS_SECONDS = 31536000 # 1 Year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ======================================================
# 9. MISCELLANEOUS
# ======================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

API_NINJAS_KEY = config("API_NINJAS_KEY", default="")

# ======================================================
# 10. LOGGING
# ======================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}