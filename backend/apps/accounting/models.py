from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

from apps.core.models import BaseModel, SoftDeleteManager

from .constants import (
    ACCOUNT_TYPE_CHOICES,
    ENTRY_SOURCE_CHOICES,
    ENTRY_STATUS_CHOICES,
    ENTRY_SOURCE_MANUAL,
    ENTRY_STATUS_DRAFT,
)


class ChartOfAccount(BaseModel):
    """
    One account in the chart of accounts (e.g. Cash, Accounts Receivable).
    Scoped by tenant (account). Account type and normal balance from constants.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="chart_of_accounts",
        db_index=True,
    )
    code = models.CharField(max_length=64, db_index=True)
    name = models.CharField(max_length=255)
    account_type = models.PositiveSmallIntegerField(
        choices=ACCOUNT_TYPE_CHOICES, db_index=True
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        db_index=True,
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_system = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "accounting_chartofaccount"
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(
                fields=["account", "code"],
                name="accounting_coa_account_code_uniq",
            )
        ]
        indexes = [
            models.Index(fields=["account", "is_active"]),
            models.Index(fields=["parent"]),
        ]

    def __str__(self):
        return f"{self.code} – {self.name}"


def get_next_entry_number(account, source=None):
    """
    Generate the next unique entry number for the given account (tenant).
    Format: JE-{year}-{seq:05d} (e.g. JE-2025-00001).
    Uses lock on Account + max existing entry_number for the year (no sequence table).
    """
    from apps.accounts.models import Account

    year = timezone.now().year
    prefix = f"JE-{year}-"
    with transaction.atomic():
        Account.objects.select_for_update().get(pk=account.pk)
        last = (
            LedgerEntry.objects.filter(
                account=account, entry_number__startswith=prefix
            )
            .order_by("-entry_number")
            .values_list("entry_number", flat=True)
            .first()
        )
        next_num = (int(last.split("-")[-1]) + 1) if last else 1
        return f"{prefix}{next_num:05d}"


class LedgerEntryManager(SoftDeleteManager):
    """Manager for LedgerEntry with next-entry-number generation."""

    def get_next_entry_number(self, account, source=None):
        return get_next_entry_number(account, source=source)


class LedgerEntry(BaseModel):
    """
    Journal entry header: one transaction/event (e.g. manual journal, opening balance).
    entry_number is unique per account; use get_next_entry_number(account) to generate.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="ledger_entries",
        db_index=True,
    )
    entry_number = models.CharField(max_length=64, db_index=True)
    entry_date = models.DateField(db_index=True)
    posting_date = models.DateField(db_index=True)
    description = models.CharField(max_length=500, blank=True)
    reference = models.CharField(max_length=255, blank=True)
    source = models.PositiveSmallIntegerField(
        choices=ENTRY_SOURCE_CHOICES,
        default=ENTRY_SOURCE_MANUAL,
        db_index=True,
    )
    status = models.PositiveSmallIntegerField(
        choices=ENTRY_STATUS_CHOICES,
        default=ENTRY_STATUS_DRAFT,
        db_index=True,
    )
    posted_at = models.DateTimeField(null=True, blank=True)
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posted_ledger_entries",
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_ledger_entries",
        db_index=True,
    )

    objects = LedgerEntryManager()

    class Meta:
        db_table = "accounting_ledgerentry"
        ordering = ["-posting_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["account", "entry_number"],
                name="accounting_entry_account_number_uniq",
            )
        ]
        indexes = [
            models.Index(fields=["account", "entry_date"]),
            models.Index(fields=["account", "status"]),
        ]

    def __str__(self):
        return f"{self.entry_number} – {self.entry_date}"


class LedgerLine(BaseModel):
    """
    One debit or credit line in a journal entry. Sum of debits must equal sum of credits per entry.
    """

    entry = models.ForeignKey(
        LedgerEntry,
        on_delete=models.CASCADE,
        related_name="lines",
        db_index=True,
    )
    chart_of_account = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.PROTECT,
        related_name="ledger_lines",
        db_index=True,
    )
    line_number = models.PositiveSmallIntegerField(default=1)
    description = models.CharField(max_length=500, blank=True)
    debit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    credit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    class Meta:
        db_table = "accounting_ledgerline"
        ordering = ["entry", "line_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["entry", "line_number"],
                name="accounting_line_entry_line_uniq",
            )
        ]
        indexes = [
            models.Index(fields=["chart_of_account", "created_at"]),
        ]

    def __str__(self):
        return f"{self.entry.entry_number} L{self.line_number} – {self.chart_of_account.code}"
