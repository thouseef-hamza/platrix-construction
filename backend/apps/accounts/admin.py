from django.contrib import admin
from django.contrib import messages

from apps.accounting.seed_chart import seed_chart_of_accounts

from .models import Account, AccountUser


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "support_email", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "support_email")
    ordering = ("-created_at",)
    actions = ["seed_chart_of_accounts_action"]

    @admin.action(description="Seed chart of accounts")
    def seed_chart_of_accounts_action(self, request, queryset):
        """Create default chart of accounts for selected account(s). Idempotent: only adds missing accounts."""
        count = seed_chart_of_accounts(queryset)
        if count:
            self.message_user(
                request,
                f"Created {count} chart of accounts row(s) for the selected account(s).",
                messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                "No new accounts created; chart of accounts for the selected account(s) already seeded.",
                messages.INFO,
            )


@admin.register(AccountUser)
class AccountUserAdmin(admin.ModelAdmin):
    list_display = ("account", "user", "role", "availability")
    list_filter = ("account", "role", "availability")
    search_fields = ("user__email", "account__name")
    list_select_related = ("account", "user")
