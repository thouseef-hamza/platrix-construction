"""
Signals for expenses app.
1. When an expense is posted, create ledger entry (expense dr; cash/ap cr).
2. When a payment is added to a posted expense, create ledger entry (AP dr, cash cr).
"""
from decimal import Decimal

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounting.constants import (
    ENTRY_SOURCE_OTHER,
    ENTRY_SOURCE_PAYMENT,
    ENTRY_STATUS_POSTED,
)
from apps.accounting.models import ChartOfAccount, LedgerEntry, LedgerLine, get_next_entry_number

from .constants import (
    COA_CODE_ACCOUNTS_PAYABLE,
    COA_CODE_CASH_BANK,
    COA_CODE_OTHER_EXPENSE,
    COA_CODE_PROJECT_EXPENSE,
    EXPENSE_STATUS_POSTED,
)
from .models import Expense, ExpensePayment


def _get_coa_by_code(account, code):
    return ChartOfAccount.objects.filter(
        account=account,
        code=code,
        is_active=True,
        is_deleted=False,
    ).first()


@receiver(post_save, sender=Expense)
def on_expense_posted_create_ledger_entry(sender, instance, created, **kwargs):
    """When expense status becomes Posted, create LedgerEntry: debit expense (5010 or 5080), credit cash and/or AP."""
    if instance.status != EXPENSE_STATUS_POSTED:
        return
    ref = f"Expense-{instance.id}"
    if LedgerEntry.objects.filter(account=instance.account, reference=ref).exists():
        return
    amount = instance.amount
    if amount <= 0:
        return
    paid = instance.paid_amount or Decimal("0.00")
    balance = amount - paid

    expense_code = COA_CODE_PROJECT_EXPENSE if instance.project_id else COA_CODE_OTHER_EXPENSE
    expense_coa = _get_coa_by_code(instance.account, expense_code)
    cash_coa = _get_coa_by_code(instance.account, COA_CODE_CASH_BANK)
    ap_coa = _get_coa_by_code(instance.account, COA_CODE_ACCOUNTS_PAYABLE)

    if not expense_coa:
        return
    if paid > 0 and not cash_coa:
        return
    if balance > 0 and not ap_coa:
        return

    payee_name = instance.payee.name if instance.payee else (instance.employee_name or instance.description or "Expense")
    desc = instance.reference or (instance.description or f"Expense #{instance.id}")[:500]
    with transaction.atomic():
        entry_number = get_next_entry_number(instance.account, source=ENTRY_SOURCE_OTHER)
        entry = LedgerEntry.objects.create(
            account=instance.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Expense {instance.reference or instance.description or instance.id} – {payee_name}",
            reference=ref,
            source=ENTRY_SOURCE_OTHER,
            status=ENTRY_STATUS_POSTED,
            posted_at=timezone.now(),
        )
        line_num = 1
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=expense_coa,
            line_number=line_num,
            description=desc,
            debit=amount,
            credit=Decimal("0.00"),
        )
        line_num += 1
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
        if balance > 0:
            LedgerLine.objects.create(
                entry=entry,
                chart_of_account=ap_coa,
                line_number=line_num,
                description=desc,
                debit=Decimal("0.00"),
                credit=balance,
            )


@receiver(post_save, sender=ExpensePayment)
def on_expense_payment_created_create_ledger_entry(sender, instance, created, **kwargs):
    """When a payment is added to a posted expense, create LedgerEntry: Debit AP (2010), Credit Cash (1010)."""
    if not created:
        return
    if instance.is_deleted:
        return
    expense = instance.expense
    if expense.status != EXPENSE_STATUS_POSTED:
        return
    amount = instance.amount or Decimal("0.00")
    if amount <= 0:
        return
    ref = f"ExpensePayment-{instance.id}"
    if LedgerEntry.objects.filter(account=expense.account, reference=ref).exists():
        return
    ap_coa = _get_coa_by_code(expense.account, COA_CODE_ACCOUNTS_PAYABLE)
    cash_coa = _get_coa_by_code(expense.account, COA_CODE_CASH_BANK)
    if not ap_coa or not cash_coa:
        return
    payee_name = expense.payee.name if expense.payee else (expense.employee_name or expense.description or "Expense")
    desc = instance.reference or f"Payment – {expense.reference or expense.description}"
    with transaction.atomic():
        entry_number = get_next_entry_number(expense.account, source=ENTRY_SOURCE_PAYMENT)
        entry = LedgerEntry.objects.create(
            account=expense.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Payment – {expense.reference or expense.description} – {payee_name}",
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
