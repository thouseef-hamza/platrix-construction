from django.contrib import admin

from .models import ActivityLog, Document


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("action_time", "user", "account", "object_repr", "action_flag", "change_message")
    list_filter = ("action_flag", "account")
    search_fields = ("object_repr", "change_message")
    list_select_related = ("user", "account", "content_type")
    ordering = ("-action_time",)
    readonly_fields = (
        "action_time",
        "account",
        "user",
        "content_type",
        "object_id",
        "object_repr",
        "action_flag",
        "change_message",
        "extra_data",
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("name", "filename", "account", "uploaded_by", "size", "created_at")
    list_filter = ("account",)
    search_fields = ("name", "filename")
    list_select_related = ("account", "uploaded_by")
    ordering = ("-created_at",)
