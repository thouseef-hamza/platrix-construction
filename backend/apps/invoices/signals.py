"""
Signals for invoices app.

Client invoices (income): when a payment is posted:
  Debit Cash (1010), Credit Construction Revenue (4010).

Subcontractor invoices (expense):
  1. When invoice is posted: Debit expense (5010 if project, else 5050),
     Credit Cash (1010) for paid amount, Credit AP (2010) for balance.
  2. When payment is posted: Debit AP (2010), Credit Cash (1010).
"""
from decimal import Decimal

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounting.constants import (
    ENTRY_SOURCE_INVOICE,
    ENTRY_SOURCE_PAYMENT,
    ENTRY_STATUS_POSTED,
)
from apps.accounting.models import ChartOfAccount, LedgerEntry, LedgerLine, get_next_entry_number

from .constants import (
    COA_CODE_ACCOUNTS_PAYABLE,
    COA_CODE_CASH_BANK,
    COA_CODE_CONSTRUCTION_REVENUE,
    COA_CODE_PROJECT_EXPENSE,
    COA_CODE_SUBCONTRACTOR_EXPENSE,
    INVOICE_STATUS_POSTED,
    INVOICE_TYPE_CLIENT,
    INVOICE_TYPE_SUBCONTRACTOR,
    PAYMENT_LEDGER_POSTED,
)
from .models import Invoice, InvoicePayment


def _get_coa_by_code(account, code):
    """Return active ChartOfAccount for this tenant with the given code, or None."""
    return ChartOfAccount.objects.filter(
        account=account,
        code=code,
        is_active=True,
        is_deleted=False,
    ).first()


@receiver(post_save, sender=InvoicePayment)
def on_client_invoice_payment_posted_create_ledger_entry(sender, instance, created, **kwargs):
    """
    When a payment is posted (status=posted) on a posted CLIENT invoice,
    create LedgerEntry: Debit Cash (1010), Credit Construction Revenue (4010).
    Construction revenue increases by the paid amount.
    """
    if instance.is_deleted:
        return
    if instance.status != PAYMENT_LEDGER_POSTED:
        return
    invoice = instance.invoice
    if invoice.invoice_type != INVOICE_TYPE_CLIENT:
        return
    if invoice.status != INVOICE_STATUS_POSTED:
        return
    amount = instance.amount or Decimal("0.00")
    if amount <= 0:
        return
    ref = f"InvoicePayment-{instance.id}"
    if LedgerEntry.objects.filter(account=invoice.account, reference=ref).exists():
        return
    cash_coa = _get_coa_by_code(invoice.account, COA_CODE_CASH_BANK)
    revenue_coa = _get_coa_by_code(invoice.account, COA_CODE_CONSTRUCTION_REVENUE)
    if not cash_coa or not revenue_coa:
        return
    desc = instance.reference or f"Client invoice payment – {invoice.reference}"
    with transaction.atomic():
        entry_number = get_next_entry_number(invoice.account, source=ENTRY_SOURCE_INVOICE)
        entry = LedgerEntry.objects.create(
            account=invoice.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Client invoice – {invoice.reference} – {invoice.party.name}",
            reference=ref,
            source=ENTRY_SOURCE_INVOICE,
            status=ENTRY_STATUS_POSTED,
            posted_at=timezone.now(),
        )
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=cash_coa,
            line_number=1,
            description=desc,
            debit=amount,
            credit=Decimal("0.00"),
        )
        LedgerLine.objects.create(
            entry=entry,
            chart_of_account=revenue_coa,
            line_number=2,
            description=desc,
            debit=Decimal("0.00"),
            credit=amount,
        )


@receiver(post_save, sender=Invoice)
def on_subcontractor_invoice_posted_create_ledger_entry(sender, instance, created, **kwargs):
    """
    When a SUBCONTRACTOR invoice is posted, create LedgerEntry:
    - Debit expense: Project Expense (5010) if project set, else Subcontractor Expense (5050)
    - Credit Cash (1010) for paid amount (paid from cash/bank)
    - Credit Accounts Payable (2010) for balance
    """
    if instance.invoice_type != INVOICE_TYPE_SUBCONTRACTOR:
        return
    if instance.status != INVOICE_STATUS_POSTED:
        return
    ref = f"SubcontractorInvoice-{instance.id}"
    if LedgerEntry.objects.filter(account=instance.account, reference=ref).exists():
        return
    amount = instance.amount or Decimal("0.00")
    if amount <= 0:
        return
    paid = instance.paid_amount or Decimal("0.00")
    balance = amount - paid

    expense_code = COA_CODE_PROJECT_EXPENSE if instance.project_id else COA_CODE_SUBCONTRACTOR_EXPENSE
    expense_coa = _get_coa_by_code(instance.account, expense_code)
    cash_coa = _get_coa_by_code(instance.account, COA_CODE_CASH_BANK)
    ap_coa = _get_coa_by_code(instance.account, COA_CODE_ACCOUNTS_PAYABLE)

    if not expense_coa:
        return
    if paid > 0 and not cash_coa:
        return
    if balance > 0 and not ap_coa:
        return

    desc = instance.reference or f"Subcontractor invoice #{instance.id}"
    with transaction.atomic():
        entry_number = get_next_entry_number(instance.account, source=ENTRY_SOURCE_INVOICE)
        entry = LedgerEntry.objects.create(
            account=instance.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Subcontractor invoice – {instance.reference} – {instance.party.name}",
            reference=ref,
            source=ENTRY_SOURCE_INVOICE,
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


@receiver(post_save, sender=InvoicePayment)
def on_subcontractor_invoice_payment_posted_create_ledger_entry(sender, instance, created, **kwargs):
    """
    When a payment is posted on a posted SUBCONTRACTOR invoice:
    Debit AP (2010), Credit Cash (1010). Paid amount comes from cash/bank.
    """
    if instance.is_deleted:
        return
    if instance.status != PAYMENT_LEDGER_POSTED:
        return
    invoice = instance.invoice
    if invoice.invoice_type != INVOICE_TYPE_SUBCONTRACTOR:
        return
    if invoice.status != INVOICE_STATUS_POSTED:
        return
    amount = instance.amount or Decimal("0.00")
    if amount <= 0:
        return
    ref = f"InvoicePayment-{instance.id}"
    if LedgerEntry.objects.filter(account=invoice.account, reference=ref).exists():
        return
    ap_coa = _get_coa_by_code(invoice.account, COA_CODE_ACCOUNTS_PAYABLE)
    cash_coa = _get_coa_by_code(invoice.account, COA_CODE_CASH_BANK)
    if not ap_coa or not cash_coa:
        return
    desc = instance.reference or f"Subcontractor invoice payment – {invoice.reference}"
    with transaction.atomic():
        entry_number = get_next_entry_number(invoice.account, source=ENTRY_SOURCE_PAYMENT)
        entry = LedgerEntry.objects.create(
            account=invoice.account,
            entry_number=entry_number,
            entry_date=instance.date,
            posting_date=instance.date,
            description=f"Payment – {invoice.reference} – {invoice.party.name}",
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
