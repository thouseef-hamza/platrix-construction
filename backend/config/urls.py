"""
URL configuration for config project.
"""
import config.admin  # noqa: F401 - unregisters Group from admin

from django.contrib import admin
from django.urls import include, path

from apps.core.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/", include("apps.core.urls")),
]
