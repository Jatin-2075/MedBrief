import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

# ======================================================
# BASE
# ======================================================
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="_v#c)12#_+wfh2$$uoknksjyh)&fkvx@$57oadlyz7&7^j64*3")

DEBUG = config("DEBUG", default=False, cast=bool)

# ======================================================
# HOSTS
# ======================================================
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default=None)
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# ======================================================
# APPS
# ======================================================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",

    "Login_Signup",
    "reports",
]

# ======================================================
# MIDDLEWARE
# ======================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

# ======================================================
# TEMPLATES
# ======================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "backend.wsgi.application"

# ======================================================
# DATABASE
# ======================================================
DATABASE_URL = config("DATABASE_URL", default=None)

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ======================================================
# AUTH / JWT
# ======================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ======================================================
# CORS + CSRF (VERCEL FRONTEND)
# ======================================================
FRONTEND_DOMAIN = "https://med-brief-h1s7.vercel.app"

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    FRONTEND_DOMAIN,
]

CSRF_TRUSTED_ORIGINS = [
    FRONTEND_DOMAIN,
]

if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

# ======================================================
# EMAIL
# ======================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = f"MedBrief <{EMAIL_HOST_USER}>"

# ======================================================
# STATIC & MEDIA
# ======================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# ======================================================
# SECURITY (PRODUCTION)
# ======================================================
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ======================================================
# MISC
# ======================================================
TIME_ZONE = "Asia/Kolkata"
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LOGIN_URL = "/login/"

API_NINJAS_KEY = config("API_NINJAS_KEY", default="")

# ======================================================
# LOGGING
# ======================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

'''
    PYTHON_VERSION==3.10.13
    SECRET_KEY=uqd=7=b*&6a$h55@y!o+r1paup07*g-14p!+h2d)(o)(#(q&-a
    DEBUG=True
    ALLOWED_HOSTS=127.0.0.1,localhost
    FRONTEND_URL=https://med-brief-h1s7.vercel.app
    EMAIL_HOST_USER=medbrief9@gmail.com
    EMAIL_HOST_PASSWORD=hkdf rvfg nowb gpga
    API_NINJAS_KEY=RoE+nmWZTPVUB34sKmFm7A==4WA1mMWA9bLQQsPp
    DATABASE_URL=postgresql://health_app_project_404_not_found_user:rLUWyGAPEL4zhEZ3MfHNQSOk5ahpwJVW@dpg-d54n33ngi27c73ed9eag-a/health_app_project_404_not_found
    '''
