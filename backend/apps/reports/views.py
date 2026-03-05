"""
Report API views: Project P&L, Overall P&L, Balance Sheet.
Requires x-account-id header. Uses ledger for P&L/Balance Sheet; project-linked
invoices/expenses/purchases for Project P&L.
"""

from decimal import Decimal
from datetime import date

from django.db.models import F, Q, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountUser
from apps.accounting.constants import (
    ACCOUNT_TYPE_ASSET,
    ACCOUNT_TYPE_EQUITY,
    ACCOUNT_TYPE_EXPENSE,
    ACCOUNT_TYPE_LIABILITY,
    ACCOUNT_TYPE_REVENUE,
    ENTRY_STATUS_POSTED,
)
from apps.accounting.models import ChartOfAccount, LedgerLine
from apps.expenses.constants import (
    EXPENSE_STATUS_POSTED,
    PAYMENT_LEDGER_POSTED as EXPENSE_PAYMENT_POSTED,
)
from apps.expenses.models import Expense, ExpensePayment
from apps.invoices.constants import (
    INVOICE_STATUS_POSTED,
    INVOICE_TYPE_CLIENT,
    INVOICE_TYPE_SUBCONTRACTOR,
    PAYMENT_LEDGER_POSTED,
)
from apps.invoices.models import Invoice, InvoicePayment
from apps.projects.models import Project
from apps.purchase.constants import (
    PURCHASE_STATUS_POSTED,
    PAYMENT_LEDGER_POSTED as PURCHASE_PAYMENT_POSTED,
)
from apps.purchase.models import Purchase, PurchasePayment


def user_account_ids(request):
    if not request.user or not request.user.is_authenticated:
        return set()
    return set(
        AccountUser.objects.filter(user=request.user, is_deleted=False).values_list(
            "account_id", flat=True
        )
    )


def _current_account_id(request):
    account_id = getattr(request, "current_account_id", None)
    if account_id is None:
        return None
    account_ids = user_account_ids(request)
    return account_id if account_id in account_ids else None


def _parse_date(value, default=None):
    if not value:
        return default
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return default


class ProjectPnLReportAPIView(APIView):
    """
    GET /reports/project-pnl/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Returns list of projects with income, expense, profit for each.
    Income: client invoice payments. Expense: posted subcontractor invoices, expenses, purchases.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        date_from = _parse_date(request.query_params.get("date_from"))
        date_to = _parse_date(request.query_params.get("date_to"))

        base_payment_q = Q(
            invoice__status=INVOICE_STATUS_POSTED,
            invoice__is_deleted=False,
            status=PAYMENT_LEDGER_POSTED,
            is_deleted=False,
        )
        if date_from:
            base_payment_q &= Q(date__gte=date_from)
        if date_to:
            base_payment_q &= Q(date__lte=date_to)

        projects = Project.objects.filter(
            account_id=account_id, is_deleted=False
        ).order_by("code")

        rows = []
        for proj in projects:
            # Income: client invoice payments for this project
            income_result = InvoicePayment.objects.filter(
                base_payment_q,
                invoice__project_id=proj.id,
                invoice__invoice_type=INVOICE_TYPE_CLIENT,
            ).aggregate(total=Sum("amount"))
            income = float(income_result["total"] or Decimal("0.00"))

            # Expense: posted subcontractor invoices + expenses + purchases (amount recognized when posted)
            sub_q = Invoice.objects.filter(
                project_id=proj.id,
                invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
                status=INVOICE_STATUS_POSTED,
                is_deleted=False,
            )
            if date_from:
                sub_q = sub_q.filter(date__gte=date_from)
            if date_to:
                sub_q = sub_q.filter(date__lte=date_to)
            sub_result = sub_q.aggregate(total=Sum("amount"))

            exp_q = Expense.objects.filter(
                project_id=proj.id,
                status=EXPENSE_STATUS_POSTED,
                is_deleted=False,
            )
            if date_from:
                exp_q = exp_q.filter(date__gte=date_from)
            if date_to:
                exp_q = exp_q.filter(date__lte=date_to)
            exp_result = exp_q.aggregate(total=Sum("amount"))

            pur_q = Purchase.objects.filter(
                project_id=proj.id,
                status=PURCHASE_STATUS_POSTED,
                is_deleted=False,
            )
            if date_from:
                pur_q = pur_q.filter(date__gte=date_from)
            if date_to:
                pur_q = pur_q.filter(date__lte=date_to)
            pur_result = pur_q.aggregate(total=Sum("amount"))
            expense = (
                float(sub_result["total"] or Decimal("0.00"))
                + float(exp_result["total"] or Decimal("0.00"))
                + float(pur_result["total"] or Decimal("0.00"))
            )
            profit = income - expense
            rows.append({
                "project_id": proj.id,
                "project_name": proj.name,
                "project_code": proj.code,
                "income": round(income, 2),
                "expense": round(expense, 2),
                "profit": round(profit, 2),
            })

        return Response({"projects": rows})


class OverallPnLReportAPIView(APIView):
    """
    GET /reports/overall-pnl/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Returns revenue and expense by chart of account from posted ledger entries.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        date_from = _parse_date(request.query_params.get("date_from"))
        date_to = _parse_date(request.query_params.get("date_to"))

        # Revenue: account_type 4, balance = credit - debit (credit-normal)
        revenue_rows = []
        for coa in ChartOfAccount.objects.filter(
            account_id=account_id,
            account_type=ACCOUNT_TYPE_REVENUE,
            is_active=True,
            is_deleted=False,
        ).order_by("code"):
            qs = LedgerLine.objects.filter(
                chart_of_account=coa,
                entry__account_id=account_id,
                entry__status=ENTRY_STATUS_POSTED,
                entry__is_deleted=False,
                is_deleted=False,
            )
            if date_from:
                qs = qs.filter(entry__posting_date__gte=date_from)
            if date_to:
                qs = qs.filter(entry__posting_date__lte=date_to)
            res = qs.aggregate(
                amt=Sum(F("credit") - F("debit"))
            )
            amt = float(res.get("amt") or Decimal("0.00"))
            if amt > 0:
                revenue_rows.append({"code": coa.code, "name": coa.name, "amount": round(amt, 2)})

        # Expense: account_type 5, balance = debit - credit (debit-normal)
        expense_rows = []
        for coa in ChartOfAccount.objects.filter(
            account_id=account_id,
            account_type=ACCOUNT_TYPE_EXPENSE,
            is_active=True,
            is_deleted=False,
        ).order_by("code"):
            qs = LedgerLine.objects.filter(
                chart_of_account=coa,
                entry__account_id=account_id,
                entry__status=ENTRY_STATUS_POSTED,
                entry__is_deleted=False,
                is_deleted=False,
            )
            if date_from:
                qs = qs.filter(entry__posting_date__gte=date_from)
            if date_to:
                qs = qs.filter(entry__posting_date__lte=date_to)
            res = qs.aggregate(
                amt=Sum(F("debit") - F("credit"))
            )
            amt = float(res.get("amt") or Decimal("0.00"))
            if amt > 0:
                expense_rows.append({"code": coa.code, "name": coa.name, "amount": round(amt, 2)})

        total_revenue = sum(r["amount"] for r in revenue_rows)
        total_expense = sum(r["amount"] for r in expense_rows)
        net_profit = total_revenue - total_expense

        return Response({
            "revenue": revenue_rows,
            "total_revenue": round(total_revenue, 2),
            "expenses": expense_rows,
            "total_expenses": round(total_expense, 2),
            "net_profit": round(net_profit, 2),
        })


class BalanceSheetReportAPIView(APIView):
    """
    GET /reports/balance-sheet/?as_of=YYYY-MM-DD
    Returns assets, liabilities, equity from posted ledger entries as of date.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        as_of = _parse_date(request.query_params.get("as_of"), default=date.today())

        def balance_for_type(account_type, debit_normal):
            rows = []
            for coa in ChartOfAccount.objects.filter(
                account_id=account_id,
                account_type=account_type,
                is_active=True,
                is_deleted=False,
            ).order_by("code"):
                qs = LedgerLine.objects.filter(
                    chart_of_account=coa,
                    entry__account_id=account_id,
                    entry__status=ENTRY_STATUS_POSTED,
                    entry__is_deleted=False,
                    entry__posting_date__lte=as_of,
                    is_deleted=False,
                )
                if debit_normal:
                    res = qs.aggregate(amt=Sum(F("debit") - F("credit")))
                else:
                    res = qs.aggregate(amt=Sum(F("credit") - F("debit")))
                amt = float(res.get("amt") or Decimal("0.00"))
                if amt != 0:
                    rows.append({"code": coa.code, "name": coa.name, "amount": round(amt, 2)})
            return rows

        assets = balance_for_type(ACCOUNT_TYPE_ASSET, debit_normal=True)
        liabilities = balance_for_type(ACCOUNT_TYPE_LIABILITY, debit_normal=False)
        equity = balance_for_type(ACCOUNT_TYPE_EQUITY, debit_normal=False)

        total_assets = sum(a["amount"] for a in assets)
        total_liabilities = sum(l["amount"] for l in liabilities)
        total_equity = sum(e["amount"] for e in equity)
        total_liabilities_equity = total_liabilities + total_equity

        return Response({
            "as_of": as_of.isoformat(),
            "assets": assets,
            "total_assets": round(total_assets, 2),
            "liabilities": liabilities,
            "total_liabilities": round(total_liabilities, 2),
            "equity": equity,
            "total_equity": round(total_equity, 2),
            "total_liabilities_and_equity": round(total_liabilities_equity, 2),
        })
