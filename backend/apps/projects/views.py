from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db.models import F, Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account, AccountUser
from apps.core.models import Document
from apps.expenses.constants import EXPENSE_STATUS_POSTED
from apps.expenses.models import Expense
from apps.invoices.constants import (
    INVOICE_STATUS_POSTED,
    INVOICE_TYPE_CLIENT,
    INVOICE_TYPE_SUBCONTRACTOR,
    PAYMENT_LEDGER_POSTED,
)
from apps.invoices.models import Invoice, InvoicePayment
from apps.purchase.constants import PURCHASE_STATUS_POSTED
from apps.purchase.models import Purchase

from .models import Project
from .serializers import (
    ProjectDocumentListSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
)


def user_account_ids(request):
    """Return set of account IDs (int) the current user is linked to."""
    if not request.user or not request.user.is_authenticated:
        return set()
    return set(
        AccountUser.objects.filter(
            user=request.user, is_deleted=False
        ).values_list("account_id", flat=True)
    )


def _current_account_id(request):
    """Account from x-account-id header; must be in user_account_ids. Returns None if missing/invalid."""
    account_id = getattr(request, "current_account_id", None)
    if account_id is None:
        return None
    account_ids = user_account_ids(request)
    return account_id if account_id in account_ids else None


def get_project_queryset(request):
    account_ids = user_account_ids(request)
    qs = Project.objects.filter(account_id__in=account_ids).select_related(
        "account", "client"
    )
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-start_date", "code")


class ProjectListCreateAPIView(APIView):
    """GET list, POST create projects. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_project_queryset(request)
        serializer = ProjectListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account = get_object_or_404(Account, pk=account_id)
        data = {**request.data, "account": account_id}
        serializer = ProjectWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            ProjectListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectUpdateAPIView(APIView):
    """GET one, PUT, PATCH update project (edit only; no delete)."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_project_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = ProjectListSerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = ProjectWriteSerializer(obj, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(ProjectListSerializer(serializer.instance).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = ProjectWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(ProjectListSerializer(serializer.instance).data)


class ProjectDocumentListCreateAPIView(APIView):
    """GET list documents for a project, POST upload a document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_project(self, pk):
        qs = get_project_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get_document_queryset(self, project):
        ct = ContentType.objects.get_for_model(Project)
        return Document.objects.filter(
            account_id=project.account_id,
            content_type_related=ct,
            object_id=str(project.pk),
            is_deleted=False,
        ).order_by("-created_at")

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = self.get_project(pk)
        qs = self.get_document_queryset(project)
        serializer = ProjectDocumentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = self.get_project(pk)
        if project.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided. Use multipart/form-data with 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = request.data.get("name", "").strip() or file_obj.name
        description = request.data.get("description", "").strip()

        doc = Document.objects.create(
            account=project.account,
            content_type_related=ContentType.objects.get_for_model(Project),
            object_id=str(project.pk),
            file=file_obj,
            name=name[:255],
            filename=file_obj.name[:255],
            description=description,
            uploaded_by=request.user,
        )
        serializer = ProjectDocumentListSerializer(
            doc, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDocumentDestroyAPIView(APIView):
    """DELETE (soft-delete) a project document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = get_project_queryset(request).filter(pk=pk).first()
        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if project.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Project)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=project.account_id,
            content_type_related=ct,
            object_id=str(project.pk),
            is_deleted=False,
        ).first()
        if not doc:
            return Response(
                {"detail": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        doc.is_deleted = True
        doc.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFinancialAPIView(APIView):
    """
    GET project financial summary: income, expense, variation, and payment transactions.
    Income = sum of posted payments on client invoices for this project.
    Expense = sum of posted payments on subcontractor invoices + expenses + purchases for this project.
    Transactions = all payment entries (income and expense) sorted by date desc.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = get_project_queryset(request).filter(pk=pk).first()
        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if project.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")

        # Income: posted payments on posted client invoices for this project
        income_result = InvoicePayment.objects.filter(
            invoice__project_id=pk,
            invoice__invoice_type=INVOICE_TYPE_CLIENT,
            invoice__status=INVOICE_STATUS_POSTED,
            invoice__is_deleted=False,
            status=PAYMENT_LEDGER_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        income = float(income_result["total"] or Decimal("0.00"))

        # Expense: posted subcontractor invoices + expenses + purchases (amount recognized when posted)
        sub_inv_result = Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        expense_result = Expense.objects.filter(
            project_id=pk,
            status=EXPENSE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        purchase_result = Purchase.objects.filter(
            project_id=pk,
            status=PURCHASE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        expense = (
            float(sub_inv_result["total"] or Decimal("0.00"))
            + float(expense_result["total"] or Decimal("0.00"))
            + float(purchase_result["total"] or Decimal("0.00"))
        )

        variation = income - expense

        # Receivables: unpaid balance on posted client invoices for this project
        receivables_result = Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_CLIENT,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum(F("amount") - F("paid_amount")))
        receivables = float(receivables_result["total"] or Decimal("0.00"))

        # Payables: unpaid balance on posted subcontractor invoices + expenses + purchases
        sub_payables_result = Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum(F("amount") - F("paid_amount")))
        exp_payables_result = Expense.objects.filter(
            project_id=pk,
            status=EXPENSE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum(F("amount") - F("paid_amount")))
        pur_payables_result = Purchase.objects.filter(
            project_id=pk,
            status=PURCHASE_STATUS_POSTED,
            is_deleted=False,
        ).aggregate(total=Sum(F("amount") - F("paid_amount")))
        payables = (
            float(sub_payables_result["total"] or Decimal("0.00"))
            + float(exp_payables_result["total"] or Decimal("0.00"))
            + float(pur_payables_result["total"] or Decimal("0.00"))
        )

        # Build transactions list (payment entries)
        transactions = []

        for ip in InvoicePayment.objects.filter(
            invoice__project_id=pk,
            invoice__invoice_type=INVOICE_TYPE_CLIENT,
            invoice__status=INVOICE_STATUS_POSTED,
            invoice__is_deleted=False,
            status=PAYMENT_LEDGER_POSTED,
            is_deleted=False,
        ).select_related("invoice", "invoice__party").order_by("-date", "-id"):
            amt = float(ip.amount or 0)
            if amt <= 0:
                continue
            transactions.append({
                "id": f"invoice-payment-{ip.id}",
                "date": ip.date.isoformat(),
                "description": f"Client invoice – {ip.invoice.reference} – {ip.invoice.party.name}",
                "amount": amt,
                "type": "income",
                "invoice_id": ip.invoice_id,
            })

        for inv in Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("party").order_by("-date", "-id"):
            amt = float(inv.amount or 0)
            if amt <= 0:
                continue
            transactions.append({
                "id": f"subcontractor-invoice-{inv.id}",
                "date": inv.date.isoformat(),
                "description": f"Subcontractor invoice – {inv.reference} – {inv.party.name}",
                "amount": -amt,
                "type": "expense",
                "invoice_id": inv.id,
            })

        for exp in Expense.objects.filter(
            project_id=pk,
            status=EXPENSE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("payee").order_by("-date", "-id"):
            amt = float(exp.amount or 0)
            if amt <= 0:
                continue
            payee = exp.payee.name if exp.payee else (exp.employee_name or "Expense")
            desc = (exp.reference or (exp.description or "")[:50] or "Expense").strip()
            transactions.append({
                "id": f"expense-{exp.id}",
                "date": exp.date.isoformat(),
                "description": f"Expense – {desc} – {payee}",
                "amount": -amt,
                "type": "expense",
                "expense_id": exp.id,
            })

        for pur in Purchase.objects.filter(
            project_id=pk,
            status=PURCHASE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("supplier").order_by("-date", "-id"):
            amt = float(pur.amount or 0)
            if amt <= 0:
                continue
            transactions.append({
                "id": f"purchase-{pur.id}",
                "date": pur.date.isoformat(),
                "description": f"Purchase – {pur.reference} – {pur.supplier.name}",
                "amount": -amt,
                "type": "expense",
                "purchase_id": pur.id,
            })

        transactions.sort(key=lambda t: (t["date"], t["id"]), reverse=True)

        # Receivables breakdown: client invoices with unpaid balance (from where you get the fund)
        receivables_breakdown = []
        for inv in Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_CLIENT,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("party").order_by("-date", "-id"):
            unpaid = float((inv.amount or Decimal("0.00")) - (inv.paid_amount or Decimal("0.00")))
            if unpaid <= 0:
                continue
            receivables_breakdown.append({
                "id": inv.id,
                "reference": inv.reference or "",
                "party_name": inv.party.name if inv.party else "",
                "unpaid": round(unpaid, 2),
                "date": inv.date.isoformat(),
            })

        # Payables breakdown: subcontractor invoices, expenses, purchases with unpaid (who to pay)
        payables_breakdown = []
        for inv in Invoice.objects.filter(
            project_id=pk,
            invoice_type=INVOICE_TYPE_SUBCONTRACTOR,
            status=INVOICE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("party").order_by("-date", "-id"):
            unpaid = float((inv.amount or Decimal("0.00")) - (inv.paid_amount or Decimal("0.00")))
            if unpaid <= 0:
                continue
            payables_breakdown.append({
                "type": "subcontractor_invoice",
                "id": inv.id,
                "reference": inv.reference or "",
                "payee_name": inv.party.name if inv.party else "",
                "unpaid": round(unpaid, 2),
                "date": inv.date.isoformat(),
            })
        for exp in Expense.objects.filter(
            project_id=pk,
            status=EXPENSE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("payee").order_by("-date", "-id"):
            unpaid = float((exp.amount or Decimal("0.00")) - (exp.paid_amount or Decimal("0.00")))
            if unpaid <= 0:
                continue
            payee_name = exp.payee.name if exp.payee else (exp.employee_name or "Expense")
            ref = (exp.reference or (exp.description or "")[:50] or "Expense").strip()
            payables_breakdown.append({
                "type": "expense",
                "id": exp.id,
                "reference": ref,
                "payee_name": payee_name,
                "unpaid": round(unpaid, 2),
                "date": exp.date.isoformat(),
            })
        for pur in Purchase.objects.filter(
            project_id=pk,
            status=PURCHASE_STATUS_POSTED,
            is_deleted=False,
        ).select_related("supplier").order_by("-date", "-id"):
            unpaid = float((pur.amount or Decimal("0.00")) - (pur.paid_amount or Decimal("0.00")))
            if unpaid <= 0:
                continue
            payables_breakdown.append({
                "type": "purchase",
                "id": pur.id,
                "reference": pur.reference or "",
                "payee_name": pur.supplier.name if pur.supplier else "",
                "unpaid": round(unpaid, 2),
                "date": pur.date.isoformat(),
            })
        payables_breakdown.sort(key=lambda x: (x["date"], x["type"], x["id"]), reverse=True)

        return Response({
            "income": round(income, 2),
            "expense": round(expense, 2),
            "variation": round(variation, 2),
            "receivables": round(receivables, 2),
            "payables": round(payables, 2),
            "receivables_breakdown": receivables_breakdown,
            "payables_breakdown": payables_breakdown,
            "transactions": transactions,
        })


class ProjectDocumentDownloadAPIView(APIView):
    """GET: stream a project document as attachment (direct download). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        project = get_project_queryset(request).filter(pk=pk).first()
        if not project:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if project.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Project)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=project.account_id,
            content_type_related=ct,
            object_id=str(project.pk),
            is_deleted=False,
        ).first()
        if not doc or not doc.file:
            return Response(
                {"detail": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        filename = doc.filename or doc.name or "document"
        return FileResponse(
            doc.file.open("rb"),
            as_attachment=True,
            filename=filename,
        )
