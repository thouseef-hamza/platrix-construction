from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import (
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CHOICES,
    PAYMENT_STATUS_CHOICES,
    PAYMENT_STATUS_NOT_COMPLETED,
    PURCHASE_STATUS_CHOICES,
    PURCHASE_STATUS_DRAFT,
)


class Purchase(BaseModel):
    """
    Purchase header scoped by tenant account. Links to supplier (Company),
    optional project, and has line items (materials) and payments.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="purchases",
        db_index=True,
    )
    supplier = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="purchases",
        db_index=True,
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="purchases",
        db_index=True,
    )
    reference = models.CharField(max_length=128, db_index=True)
    date = models.DateField(db_index=True)
    status = models.IntegerField(
        choices=PURCHASE_STATUS_CHOICES,
        db_index=True,
        default=PURCHASE_STATUS_DRAFT,
    )
    payment_method = models.IntegerField(
        choices=PAYMENT_METHOD_CHOICES,
        db_index=True,
        default=PAYMENT_METHOD_CASH,
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total of line items",
    )
    paid_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_status = models.IntegerField(
        choices=PAYMENT_STATUS_CHOICES,
        db_index=True,
        default=PAYMENT_STATUS_NOT_COMPLETED,
    )
    description = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "purchase_purchase"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["account", "status"]),
            models.Index(fields=["account", "date"]),
            models.Index(fields=["account", "is_deleted"]),
            models.Index(fields=["supplier"]),
            models.Index(fields=["project"]),
        ]
        verbose_name_plural = "purchases"

    def __str__(self):
        return f"{self.reference} – {self.supplier.name}"


class PurchaseLineItem(BaseModel):
    """Single line on a purchase: material, quantity, rate, amount."""

    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name="line_items",
        db_index=True,
    )
    material = models.ForeignKey(
        "inventory.Material",
        on_delete=models.PROTECT,
        related_name="purchase_line_items",
        db_index=True,
    )
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        default=Decimal("0"),
    )
    rate = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="quantity * rate",
    )

    class Meta:
        db_table = "purchase_lineitem"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["purchase"]),
            models.Index(fields=["purchase", "is_deleted"]),
        ]
        verbose_name_plural = "purchase line items"

    def save(self, *args, **kwargs):
        if self.quantity is not None and self.rate is not None:
            self.amount = self.quantity * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.purchase.reference} – {self.material.name} x {self.quantity}"


class PurchasePayment(BaseModel):
    """Payment made against a purchase."""

    purchase = models.ForeignKey(
        Purchase,
        on_delete=models.CASCADE,
        related_name="payments",
        db_index=True,
    )
    date = models.DateField()
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    reference = models.CharField(max_length=128, blank=True)

    class Meta:
        db_table = "purchase_payment"
        ordering = ["-date", "id"]
        indexes = [
            models.Index(fields=["purchase"]),
            models.Index(fields=["purchase", "is_deleted"]),
        ]
        verbose_name_plural = "purchase payments"

    def __str__(self):
        return f"{self.purchase.reference} – {self.amount} on {self.date}"
