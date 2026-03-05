from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "account", "client", "project_type", "status")
    list_filter = ("project_type", "status")
    search_fields = ("name", "code")
    raw_id_fields = ("account", "client")
