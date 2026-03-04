from django.contrib import admin
from .models import Purchase, PurchaseLineItem, PurchasePayment


class PurchaseLineItemInline(admin.TabularInline):
    model = PurchaseLineItem
    extra = 0
    raw_id_fields = ("material",)


class PurchasePaymentInline(admin.TabularInline):
    model = PurchasePayment
    extra = 0


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("reference", "supplier", "date", "status", "amount", "paid_amount", "payment_status")
    list_filter = ("status", "payment_method", "payment_status")
    search_fields = ("reference", "supplier__name")
    raw_id_fields = ("account", "supplier", "project")
    date_hierarchy = "date"
    inlines = [PurchaseLineItemInline, PurchasePaymentInline]


@admin.register(PurchaseLineItem)
class PurchaseLineItemAdmin(admin.ModelAdmin):
    list_display = ("purchase", "material", "quantity", "rate", "amount")
    raw_id_fields = ("purchase", "material")


@admin.register(PurchasePayment)
class PurchasePaymentAdmin(admin.ModelAdmin):
    list_display = ("purchase", "date", "amount", "reference")
    raw_id_fields = ("purchase",)
    date_hierarchy = "date"
