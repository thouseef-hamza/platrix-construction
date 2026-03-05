"""
Dashboard API: metrics, cash flow, recent projects.
Requires x-account-id header.
"""

import calendar
from datetime import date

from django.db.models import Sum
from django.db.models.functions import ExtractMonth
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountUser
from apps.expenses.constants import EXPENSE_STATUS_POSTED
from apps.expenses.models import Expense
from apps.invoices.constants import (
    INVOICE_STATUS_POSTED,
    INVOICE_TYPE_CLIENT,
    INVOICE_TYPE_SUBCONTRACTOR,
    PAYMENT_LEDGER_POSTED,
)
from apps.invoices.models import Invoice, InvoicePayment
from apps.projects.constants import PROJECT_STATUS_ACTIVE
from apps.projects.models import Project
from apps.purchase.constants import PURCHASE_STATUS_POSTED
from apps.purchase.models import Purchase
from apps.employees.models import Employee


def user_account_ids(request):
    if not request.user or not request.user.is_authenticated:
        return set()
    return set(
        AccountUser.objects.filter(
            user=request.user, is_deleted=False
        ).values_list("account_id", flat=True)
    )


def _current_account_id(request):
    account_id = getattr(request, "current_account_id", None)
    if account_id is None:
        return None
    account_ids = user_account_ids(request)
    return account_id if account_id in account_ids else None


class DashboardAPIView(APIView):
    """
    GET /api/dashboard/
    Returns metrics, cash flow by month, and recent projects for the account.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = date.today()
        year_start = date(today.year, 1, 1)
        month_end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

        # Active projects count
        active_projects = Project.objects.filter(
            account_id=account_id,
            status=PROJECT_STATUS_ACTIVE,
            is_deleted=False,
        ).count()

        # Expenses MTD: posted subcontractor invoices + expenses + purchases (full current month)
        mtd_start = date(today.year, today.month, 1)
        sub_mtd = Invoice.objects.filter(
            account_id=account_id,
            invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
            date__gte=mtd_start,
            date__lte=month_end,
        ).aggregate(total=Sum("amount"))
        exp_mtd = Expense.objects.filter(
            account_id=account_id,
            status=EXPENSE_STATUS_POSTED,
            is_deleted=False,
            date__gte=mtd_start,
            date__lte=month_end,
        ).aggregate(total=Sum("amount"))
        pur_mtd = Purchase.objects.filter(
            account_id=account_id,
            status=PURCHASE_STATUS_POSTED,
            is_deleted=False,
            date__gte=mtd_start,
            date__lte=month_end,
        ).aggregate(total=Sum("amount"))
        expenses_mtd = float(sub_mtd["total"] or 0) + float(exp_mtd["total"] or 0) + float(pur_mtd["total"] or 0)

        # Invoices MTD: client invoice payments (full current month)
        inv_mtd = InvoicePayment.objects.filter(
            invoice__account_id=account_id,
            invoice__invoice_type=INVOICE_TYPE_CLIENT,
            invoice__status=INVOICE_STATUS_POSTED,
            invoice__is_deleted=False,
            status=PAYMENT_LEDGER_POSTED,
            is_deleted=False,
            date__gte=mtd_start,
            date__lte=month_end,
        ).aggregate(total=Sum("amount"))
        invoices_mtd = float(inv_mtd["total"] or 0)

        # Employees count
        employees_count = Employee.objects.filter(
            account_id=account_id,
            is_deleted=False,
        ).count()

        # Cash flow by month (current year): invoices and expenses per month
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        invoices_by_month = [0.0] * 12
        expenses_by_month = [0.0] * 12

        # Client invoice payments by month (year to last day of current month)
        inv_agg = (
            InvoicePayment.objects.filter(
                invoice__account_id=account_id,
                invoice__invoice_type=INVOICE_TYPE_CLIENT,
                invoice__status=INVOICE_STATUS_POSTED,
                invoice__is_deleted=False,
                status=PAYMENT_LEDGER_POSTED,
                is_deleted=False,
                date__gte=year_start,
                date__lte=month_end,
            )
            .annotate(month=ExtractMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        )
        for row in inv_agg:
            invoices_by_month[row["month"] - 1] = float(row["total"] or 0)

        # Expenses by month: posted subcontractor invoices + expenses + purchases
        sub_agg = (
            Invoice.objects.filter(
                account_id=account_id,
                invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
                status=INVOICE_STATUS_POSTED,
                is_deleted=False,
                date__gte=year_start,
                date__lte=month_end,
            )
            .annotate(month=ExtractMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        )
        for row in sub_agg:
            expenses_by_month[row["month"] - 1] += float(row["total"] or 0)

        exp_agg = (
            Expense.objects.filter(
                account_id=account_id,
                status=EXPENSE_STATUS_POSTED,
                is_deleted=False,
                date__gte=year_start,
                date__lte=month_end,
            )
            .annotate(month=ExtractMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        )
        for row in exp_agg:
            expenses_by_month[row["month"] - 1] += float(row["total"] or 0)

        pur_agg = (
            Purchase.objects.filter(
                account_id=account_id,
                status=PURCHASE_STATUS_POSTED,
                is_deleted=False,
                date__gte=year_start,
                date__lte=month_end,
            )
            .annotate(month=ExtractMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
        )
        for row in pur_agg:
            expenses_by_month[row["month"] - 1] += float(row["total"] or 0)

        # Recent projects (last 5)
        recent = (
            Project.objects.filter(
                account_id=account_id,
                is_deleted=False,
            )
            .select_related("client")
            .order_by("-start_date", "-created_at")[:5]
        )
        status_labels = dict(Project._meta.get_field("status").choices)
        recent_projects = [
            {
                "id": p.id,
                "name": p.name,
                "client_name": p.client.name if p.client else "—",
                "status": status_labels.get(p.status, "—"),
            }
            for p in recent
        ]

        return Response({
            "metrics": {
                "active_projects": active_projects,
                "expenses_mtd": round(expenses_mtd, 2),
                "invoices_mtd": round(invoices_mtd, 2),
                "employees_count": employees_count,
            },
            "cash_flow": {
                "months": month_names,
                "invoices": [round(x, 2) for x in invoices_by_month],
                "expenses": [round(x, 2) for x in expenses_by_month],
            },
            "recent_projects": recent_projects,
        })
