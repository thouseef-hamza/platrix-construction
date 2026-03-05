from django.contrib import admin
from .models import Invoice, InvoicePayment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "invoice_type",
        "party",
        "project",
        "date",
        "status",
        "amount",
        "paid_amount",
        "payment_status",
    )
    list_filter = ("status", "invoice_type", "payment_method", "payment_status")


@admin.register(InvoicePayment)
class InvoicePaymentAdmin(admin.ModelAdmin):
    list_display = ("invoice", "date", "amount", "reference", "status")
