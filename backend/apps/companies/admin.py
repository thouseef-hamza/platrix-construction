from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "account", "company_type")
    list_filter = ("company_type",)
    search_fields = ("name",)
    raw_id_fields = ("account",)
