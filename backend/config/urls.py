"""
URL configuration for config project.
"""
import config.admin  # noqa: F401 - unregisters Group from admin

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.core.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
