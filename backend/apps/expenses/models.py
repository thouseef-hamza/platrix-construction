from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import (
    PAYMENT_LEDGER_DRAFT,
    PAYMENT_LEDGER_STATUS_CHOICES,
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CHOICES,
    PAYMENT_STATUS_CHOICES,
    PAYMENT_STATUS_NOT_COMPLETED,
    EXPENSE_STATUS_CHOICES,
    EXPENSE_STATUS_DRAFT,
    EXPENSE_CATEGORY_CHOICES,
    EXPENSE_CATEGORY_GENERAL,
    LABOR_TYPE_CHOICES,
)


class Expense(BaseModel):
    """
    Expense scoped by tenant account. Matches frontend: category (project/general/
    outsourced_labor/employee_paid), description, amount, optional project, labor fields,
    optional employee ref, payment method, payments.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="expenses",
        db_index=True,
    )
    payee = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
        db_index=True,
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
        db_index=True,
    )
    reference = models.CharField(max_length=128, db_index=True, blank=True, default="")
    date = models.DateField(db_index=True)
    status = models.IntegerField(
        choices=EXPENSE_STATUS_CHOICES,
        db_index=True,
        default=EXPENSE_STATUS_DRAFT,
    )
    category = models.IntegerField(
        choices=EXPENSE_CATEGORY_CHOICES,
        db_index=True,
        default=EXPENSE_CATEGORY_GENERAL,
    )
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    # For outsourced_labor: labor_type (hourly/daily), quantity, rate; amount = quantity * rate
    labor_type = models.IntegerField(
        choices=LABOR_TYPE_CHOICES,
        null=True,
        blank=True,
        db_index=True,
    )
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=4,
        null=True,
        blank=True,
    )
    rate = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    # For employee_paid: store employee ref from frontend (no Employee FK required)
    employee_id = models.CharField(max_length=64, blank=True, db_index=True)
    employee_name = models.CharField(max_length=255, blank=True)
    payment_method = models.IntegerField(
        choices=PAYMENT_METHOD_CHOICES,
        db_index=True,
        default=PAYMENT_METHOD_CASH,
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
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "expenses_expense"
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["account", "status"]),
            models.Index(fields=["account", "date"]),
            models.Index(fields=["account", "category"]),
            models.Index(fields=["account", "is_deleted"]),
            models.Index(fields=["payee"]),
            models.Index(fields=["project"]),
        ]
        verbose_name_plural = "expenses"

    def __str__(self):
        payee_name = self.payee.name if self.payee else (self.employee_name or "—")
        ref = self.reference or (self.description[:50] + "…" if len(self.description or "") > 50 else (self.description or "Expense"))
        return f"{ref} – {payee_name}"


class ExpensePayment(BaseModel):
    """Payment made against an expense. Ledger status: draft (no ledger) or posted (AP dr, Cash cr)."""

    expense = models.ForeignKey(
        Expense,
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
        db_table = "expenses_expensepayment"
        ordering = ["-date", "id"]
        indexes = [
            models.Index(fields=["expense"]),
            models.Index(fields=["expense", "is_deleted"]),
        ]
        verbose_name_plural = "expense payments"

    def __str__(self):
        return f"{self.expense.reference} – {self.amount} on {self.date}"
