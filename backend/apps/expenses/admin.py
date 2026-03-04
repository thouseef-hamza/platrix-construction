from django.contrib import admin
from .models import Expense, ExpensePayment


class ExpensePaymentInline(admin.TabularInline):
    model = ExpensePayment
    extra = 0
    show_change_link = True


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("reference", "category", "payee", "project", "date", "status", "amount", "paid_amount", "payment_status")
    list_filter = ("status", "category", "payment_method", "payment_status")
    search_fields = ("reference", "payee__name")
    inlines = [ExpensePaymentInline]


@admin.register(ExpensePayment)
class ExpensePaymentAdmin(admin.ModelAdmin):
    list_display = ("expense", "date", "amount", "reference")
