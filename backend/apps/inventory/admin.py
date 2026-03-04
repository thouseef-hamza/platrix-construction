from django.contrib import admin
from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "unit", "rate", "account", "created_at")
    list_filter = ("unit", "account")
    search_fields = ("name", "code")
    ordering = ("code",)
