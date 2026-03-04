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

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
