import os

from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0").split(",")
    if h.strip()
]
CORS_ALLOW_ALL_ORIGINS = True
