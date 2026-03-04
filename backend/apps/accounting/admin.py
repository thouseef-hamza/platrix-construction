from django.contrib import admin

from .models import ChartOfAccount, LedgerEntry, LedgerLine


@admin.register(ChartOfAccount)
class ChartOfAccountAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "account_type", "account", "parent", "is_active", "is_system")
    list_filter = ("account", "account_type", "is_active", "is_system")
    search_fields = ("code", "name")
    list_select_related = ("account", "parent")
    ordering = ("account", "code")


class LedgerLineInline(admin.TabularInline):
    model = LedgerLine
    extra = 1
    autocomplete_fields = ("chart_of_account",)


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("entry_number", "account", "entry_date", "posting_date", "source", "status", "created_by")
    list_filter = ("account", "source", "status")
    search_fields = ("entry_number", "description", "reference")
    list_select_related = ("account", "created_by", "posted_by")
    ordering = ("-posting_date", "-created_at")
    inlines = [LedgerLineInline]
    autocomplete_fields = ("account",)


@admin.register(LedgerLine)
class LedgerLineAdmin(admin.ModelAdmin):
    list_display = ("entry", "chart_of_account", "line_number", "debit", "credit", "description")
    list_filter = ("entry__account",)
    search_fields = ("description", "entry__entry_number")
    list_select_related = ("entry", "chart_of_account")
    ordering = ("entry", "line_number")
    autocomplete_fields = ("entry", "chart_of_account")
