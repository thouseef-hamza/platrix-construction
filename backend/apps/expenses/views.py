from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounting.constants import ACCOUNT_TYPE_EXPENSE
from apps.accounting.models import ChartOfAccount
from apps.accounts.models import AccountUser
from apps.core.models import Document

from .constants import EXPENSE_STATUS_POSTED, GENERAL_EXPENSE_EXCLUDED_COA_CODES, PAYMENT_LEDGER_DRAFT
from .models import Expense, ExpensePayment
from .serializers import (
    ExpenseDetailSerializer,
    ExpenseDocumentListSerializer,
    ExpenseListSerializer,
    ExpensePaymentReadSerializer,
    ExpensePaymentWriteSerializer,
    ExpenseWriteSerializer,
    _recompute_payment_status,
)


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


def get_expense_queryset(request):
    account_ids = user_account_ids(request)
    qs = Expense.objects.filter(account_id__in=account_ids).select_related(
        "account", "payee", "project", "expense_account"
    ).prefetch_related("payments")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-date", "-created_at")


class ExpenseListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_expense_queryset(request)
        serializer = ExpenseListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        from apps.accounts.models import Account

        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account = get_object_or_404(Account, pk=account_id)
        data = {**request.data, "account": account_id}
        serializer = ExpenseWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            ExpenseListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class ExpenseAccountsForGeneralAPIView(APIView):
    """GET list of expense COA accounts eligible for general expense (excludes 5010, 5050, 5060). Requires x-account-id."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        qs = ChartOfAccount.objects.filter(
            account_id=account_id,
            account_type=ACCOUNT_TYPE_EXPENSE,
            is_active=True,
            is_deleted=False,
        ).exclude(
            code__in=GENERAL_EXPENSE_EXCLUDED_COA_CODES,
        ).order_by("code")
        data = [{"id": coa.id, "code": coa.code, "name": coa.name} for coa in qs]
        return Response(data)


class ExpenseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_expense_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = ExpenseDetailSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = ExpenseWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(ExpenseDetailSerializer(serializer.instance).data)


class ExpensePaymentListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_expense(self, pk):
        qs = get_expense_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = self.get_expense(pk)
        payments = expense.payments.filter(is_deleted=False).order_by("-date", "id")
        serializer = ExpensePaymentReadSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = self.get_expense(pk)
        if expense.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        if expense.status != EXPENSE_STATUS_POSTED:
            return Response(
                {"detail": "Payment entries can only be created when the expense is posted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ExpensePaymentWriteSerializer(
            data=request.data, context={"expense": expense}
        )
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(expense=expense)
        _recompute_payment_status(expense)
        return Response(
            ExpensePaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


def get_payment_for_expense(request, expense_pk, payment_pk):
    """Return ExpensePayment if it belongs to the given expense and user has access."""
    qs = get_expense_queryset(request)
    expense = get_object_or_404(qs, pk=expense_pk)
    if expense.account_id not in user_account_ids(request):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have access to this account.")
    return get_object_or_404(
        ExpensePayment.objects.filter(expense=expense, is_deleted=False),
        pk=payment_pk,
    )


class ExpensePaymentDetailAPIView(APIView):
    """PATCH a single payment (e.g. set status to posted). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, payment_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment = get_payment_for_expense(request, pk, payment_pk)
        serializer = ExpensePaymentWriteSerializer(
            payment, data=request.data, partial=True, context={"expense": payment.expense}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _recompute_payment_status(payment.expense)
        return Response(ExpensePaymentReadSerializer(payment).data)

    def delete(self, request, pk, payment_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment = get_payment_for_expense(request, pk, payment_pk)
        if payment.status != PAYMENT_LEDGER_DRAFT:
            return Response(
                {"detail": "Only draft payments can be deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        payment.is_deleted = True
        payment.save(update_fields=["is_deleted", "updated_at"])
        _recompute_payment_status(payment.expense)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseDocumentListCreateAPIView(APIView):
    """GET list documents for an expense, POST upload a document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_expense(self, pk):
        qs = get_expense_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get_document_queryset(self, expense):
        ct = ContentType.objects.get_for_model(Expense)
        return Document.objects.filter(
            account_id=expense.account_id,
            content_type_related=ct,
            object_id=str(expense.pk),
            is_deleted=False,
        ).order_by("-created_at")

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = self.get_expense(pk)
        qs = self.get_document_queryset(expense)
        serializer = ExpenseDocumentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = self.get_expense(pk)
        if expense.account_id not in user_account_ids(request):
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
            account=expense.account,
            content_type_related=ContentType.objects.get_for_model(Expense),
            object_id=str(expense.pk),
            file=file_obj,
            name=name[:255],
            filename=file_obj.name[:255],
            description=description,
            uploaded_by=request.user,
        )
        serializer = ExpenseDocumentListSerializer(
            doc, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExpenseDocumentDownloadAPIView(APIView):
    """GET: stream an expense document as attachment (direct download). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = get_expense_queryset(request).filter(pk=pk).first()
        if not expense:
            return Response(
                {"detail": "Expense not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if expense.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Expense)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=expense.account_id,
            content_type_related=ct,
            object_id=str(expense.pk),
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


class ExpenseDocumentDestroyAPIView(APIView):
    """DELETE (soft-delete) an expense document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        expense = get_expense_queryset(request).filter(pk=pk).first()
        if not expense:
            return Response(
                {"detail": "Expense not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if expense.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Expense)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=expense.account_id,
            content_type_related=ct,
            object_id=str(expense.pk),
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
