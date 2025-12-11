from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-your-secret-key"

DEBUG = True

ALLOWED_HOSTS = ["*"]


# ---------------------------------------------------
# INSTALLED APPS
# ---------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # API + Auth
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",

    # your app
    "authentication",
]


# ---------------------------------------------------
# MIDDLEWARE
# ---------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # CORS must be before CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ---------------------------------------------------
# CORS (React)
# ---------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
]

CORS_EXPOSE_HEADERS = [
    "Authorization",
]


CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]


# ---------------------------------------------------
# REST + JWT
# ---------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}


# ---------------------------------------------------
# URLS + WSGI
# ---------------------------------------------------
ROOT_URLCONF = "backend.urls"
WSGI_APPLICATION = "backend.wsgi.application"


# ---------------------------------------------------
# TEMPLATES (required by Django even if unused)
# ---------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ---------------------------------------------------
# DATABASE
# ---------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ---------------------------------------------------
# STATIC FILES
# ---------------------------------------------------
STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
