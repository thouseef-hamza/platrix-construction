"""
Signals for purchase app.

1. When a purchase is posted, create a ledger entry (expense dr; cash/ap cr).
2. When a payment is added to a posted purchase, create a payment ledger entry (AP dr, cash cr).
"""
from decimal import Decimal

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounting.constants import (
    ENTRY_SOURCE_PAYMENT,
    ENTRY_SOURCE_PURCHASE,
    ENTRY_STATUS_POSTED,
)
from apps.accounting.models import ChartOfAccount, LedgerEntry, LedgerLine, get_next_entry_number

from .constants import (
    COA_CODE_ACCOUNTS_PAYABLE,
    COA_CODE_CASH_BANK,
    COA_CODE_MATERIALS_EXPENSE,
    COA_CODE_PROJECT_EXPENSE,
    PAYMENT_LEDGER_POSTED,
    PURCHASE_STATUS_POSTED,
)
from .models import Purchase, PurchasePayment


def _get_coa_by_code(account, code):
    """Return active ChartOfAccount for this tenant with the given code, or None."""
    return ChartOfAccount.objects.filter(
        account=account,
        code=code,
        is_active=True,
        is_deleted=False,
    ).first()


@receiver(post_save, sender=Purchase)
def on_purchase_posted_create_ledger_entry(sender, instance, created, **kwargs):
    """When a purchase status becomes Posted, create LedgerEntry with correct accounts by case."""
    if instance.status != PURCHASE_STATUS_POSTED:
        return
    ref = f"Purchase-{instance.id}"
    if LedgerEntry.objects.filter(account=instance.account, reference=ref).exists():
        return
    amount = instance.amount
    if amount <= 0:
        return
    paid = instance.paid_amount or Decimal("0.00")
    balance = amount - paid  # unpaid portion

    # Expense: Project Expense (5010) if project set, else Materials Expense (5020)
    expense_code = COA_CODE_PROJECT_EXPENSE if instance.project_id else COA_CODE_MATERIALS_EXPENSE
    expense_coa = _get_coa_by_code(instance.account, expense_code)
    cash_coa = _get_coa_by_code(instance.account, COA_CODE_CASH_BANK)
    ap_coa = _get_coa_by_code(instance.account, COA_CODE_ACCOUNTS_PAYABLE)

    if not expense_coa:
        return
    if paid > 0 and not cash_coa:
        return
    if balance > 0 and not ap_coa:
        return

    desc = instance.reference or f"Purchase #{instance.id}"
    with transaction.atomic():
        entry_number = get_next_entry_number(instance.account, source=ENTRY_SOURCE_PURCHASE)
        entry = LedgerEntry.objects.create(
            account=instance.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Purchase {instance.reference} – {instance.supplier.name}",
            reference=ref,
            source=ENTRY_SOURCE_PURCHASE,
            status=ENTRY_STATUS_POSTED,
            posted_at=timezone.now(),
        )
        line_num = 1
        # Line 1: Debit expense (full amount)
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=expense_coa,
            line_number=line_num,
            description=desc,
            debit=amount,
            credit=Decimal("0.00"),
        )
        line_num += 1
        # Line 2: Credit Cash & Bank by paid amount (when paid_amount > 0)
        if paid > 0:
            LedgerLine.objects.create(
                entry=entry,
                chart_of_account=cash_coa,
                line_number=line_num,
                description=desc,
                debit=Decimal("0.00"),
                credit=paid,
            )
            line_num += 1
        # Line 3: Credit Accounts Payable by balance (when unpaid portion > 0)
        if balance > 0:
            LedgerLine.objects.create(
                entry=entry,
                chart_of_account=ap_coa,
                line_number=line_num,
                description=desc,
                debit=Decimal("0.00"),
                credit=balance,
            )


@receiver(post_save, sender=PurchasePayment)
def on_purchase_payment_created_create_ledger_entry(sender, instance, created, **kwargs):
    """When a payment is posted (status=posted) on a posted purchase, create LedgerEntry: Debit AP (2010), Credit Cash (1010)."""
    if instance.is_deleted:
        return
    if instance.status != PAYMENT_LEDGER_POSTED:
        return
    purchase = instance.purchase
    if purchase.status != PURCHASE_STATUS_POSTED:
        return
    amount = instance.amount or Decimal("0.00")
    if amount <= 0:
        return
    ref = f"PurchasePayment-{instance.id}"
    if LedgerEntry.objects.filter(account=purchase.account, reference=ref).exists():
        return
    ap_coa = _get_coa_by_code(purchase.account, COA_CODE_ACCOUNTS_PAYABLE)
    cash_coa = _get_coa_by_code(purchase.account, COA_CODE_CASH_BANK)
    if not ap_coa or not cash_coa:
        return
    desc = instance.reference or f"Payment – {purchase.reference}"
    with transaction.atomic():
        entry_number = get_next_entry_number(purchase.account, source=ENTRY_SOURCE_PAYMENT)
        entry = LedgerEntry.objects.create(
            account=purchase.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Payment – {purchase.reference} – {purchase.supplier.name}",
            reference=ref,
            source=ENTRY_SOURCE_PAYMENT,
            status=ENTRY_STATUS_POSTED,
            posted_at=timezone.now(),
        )
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=ap_coa,
            line_number=1,
            description=desc,
            debit=amount,
            credit=Decimal("0.00"),
        )
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=cash_coa,
            line_number=2,
            description=desc,
            debit=Decimal("0.00"),
            credit=amount,
        )
