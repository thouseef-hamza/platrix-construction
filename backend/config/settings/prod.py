import os

from .base import *  # noqa: F401, F403

DEBUG = False
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]
CORS_ALLOW_ALL_ORIGINS = False
if os.getenv("CORS_ALLOWED_ORIGINS"):
    CORS_ALLOWED_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ALLOWED_ORIGINS").split(",")
        if o.strip()
    ]

# CSRF trusted origins (required for Django 4+ when using HTTPS or cross-origin)
_csrf_origins = [
    o.strip()
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS = _csrf_origins

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
