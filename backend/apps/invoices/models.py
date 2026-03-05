from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import (
    INVOICE_STATUS_CHOICES,
    INVOICE_STATUS_DRAFT,
    INVOICE_TYPE_CHOICES,
    PAYMENT_LEDGER_DRAFT,
    PAYMENT_LEDGER_STATUS_CHOICES,
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CHOICES,
    PAYMENT_STATUS_CHOICES,
    PAYMENT_STATUS_NOT_COMPLETED,
)


class Invoice(BaseModel):
    """
    Unified invoice for both client (receivable) and subcontractor (payable).
    Scoped by account; party is the client or subcontractor Company.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="invoices",
        db_index=True,
    )
    party = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="invoices",
        db_index=True,
        help_text="Client or subcontractor company.",
    )
    invoice_type = models.IntegerField(
        choices=INVOICE_TYPE_CHOICES,
        db_index=True,
        help_text="0=Client (receivable), 1=Subcontractor (payable).",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
        db_index=True,
    )
    reference = models.CharField(max_length=128, db_index=True)
    date = models.DateField(db_index=True)
    status = models.IntegerField(
        choices=INVOICE_STATUS_CHOICES,
        db_index=True,
        default=INVOICE_STATUS_DRAFT,
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
        help_text="Invoice amount.",
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
        db_table = "invoices_invoice"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["account", "status"]),
            models.Index(fields=["account", "invoice_type"]),
            models.Index(fields=["account", "date"]),
            models.Index(fields=["account", "is_deleted"]),
            models.Index(fields=["party"]),
            models.Index(fields=["project"]),
        ]
        verbose_name_plural = "invoices"

    def __str__(self):
        return f"{self.reference} – {self.party.name}"


class InvoicePayment(BaseModel):
    """Payment made against an invoice. Draft = no ledger; posted = ledger entry."""

    invoice = models.ForeignKey(
        Invoice,
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
    status = models.IntegerField(
        choices=PAYMENT_LEDGER_STATUS_CHOICES,
        db_index=True,
        default=PAYMENT_LEDGER_DRAFT,
    )

    class Meta:
        db_table = "invoices_invoicepayment"
        ordering = ["-date", "id"]
        indexes = [
            models.Index(fields=["invoice"]),
            models.Index(fields=["invoice", "is_deleted"]),
        ]
        verbose_name_plural = "invoice payments"

    def __str__(self):
        return f"{self.invoice.reference} – {self.amount} on {self.date}"
    