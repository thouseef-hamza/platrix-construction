from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountUser
from apps.core.models import Document

from .constants import (
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_POSTED,
    PAYMENT_LEDGER_DRAFT,
)
from .models import Invoice, InvoicePayment
from .serializers import (
    InvoiceDetailSerializer,
    InvoiceDocumentListSerializer,
    InvoiceListSerializer,
    InvoicePaymentReadSerializer,
    InvoicePaymentWriteSerializer,
    InvoiceWriteSerializer,
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


def get_invoice_queryset(request):
    account_ids = user_account_ids(request)
    qs = Invoice.objects.filter(account_id__in=account_ids).select_related(
        "account", "party", "project"
    ).prefetch_related("payments")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-date", "-created_at")


def get_payment_for_invoice(request, invoice_pk, payment_pk):
    qs = get_invoice_queryset(request)
    invoice = get_object_or_404(qs, pk=invoice_pk)
    if invoice.account_id not in user_account_ids(request):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("You do not have access to this account.")
    return get_object_or_404(
        InvoicePayment.objects.filter(invoice=invoice, is_deleted=False),
        pk=payment_pk,
    )


class InvoiceListCreateAPIView(APIView):
    """GET list, POST create invoices (client & subcontractor). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_invoice_queryset(request)
        invoice_type = request.query_params.get("invoice_type")
        if invoice_type in ("0", "1"):
            qs = qs.filter(invoice_type=int(invoice_type))
        serializer = InvoiceListSerializer(qs, many=True)
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
        serializer = InvoiceWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            InvoiceListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class InvoiceDetailAPIView(APIView):
    """GET one, PATCH update (draft only), DELETE (draft only, soft-delete)."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_invoice_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = InvoiceDetailSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = InvoiceWriteSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(InvoiceDetailSerializer(serializer.instance).data)

    def delete(self, request, pk):
        from rest_framework.exceptions import PermissionDenied

        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            raise PermissionDenied("You do not have access to this account.")
        if obj.status != INVOICE_STATUS_DRAFT:
            return Response(
                {"detail": "Only draft invoices can be deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvoicePaymentListCreateAPIView(APIView):
    """GET list payments for an invoice, POST add a payment. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_invoice(self, pk):
        qs = get_invoice_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = self.get_invoice(pk)
        payments = invoice.payments.filter(is_deleted=False).order_by("-date", "id")
        serializer = InvoicePaymentReadSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = self.get_invoice(pk)
        if invoice.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        if invoice.status != INVOICE_STATUS_POSTED:
            return Response(
                {"detail": "Payment entries can only be created when the invoice is posted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = InvoicePaymentWriteSerializer(
            data=request.data, context={"invoice": invoice}
        )
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(invoice=invoice)
        _recompute_payment_status(invoice)
        return Response(
            InvoicePaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class InvoicePaymentDetailAPIView(APIView):
    """PATCH a single payment. DELETE draft only (soft-delete)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, payment_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment = get_payment_for_invoice(request, pk, payment_pk)
        serializer = InvoicePaymentWriteSerializer(
            payment, data=request.data, partial=True, context={"invoice": payment.invoice}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _recompute_payment_status(payment.invoice)
        return Response(InvoicePaymentReadSerializer(payment).data)

    def delete(self, request, pk, payment_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment = get_payment_for_invoice(request, pk, payment_pk)
        if payment.status != PAYMENT_LEDGER_DRAFT:
            return Response(
                {"detail": "Only draft payments can be deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        payment.is_deleted = True
        payment.save(update_fields=["is_deleted", "updated_at"])
        _recompute_payment_status(payment.invoice)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvoiceDocumentListCreateAPIView(APIView):
    """GET list documents for an invoice, POST upload a document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_invoice(self, pk):
        qs = get_invoice_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get_document_queryset(self, invoice):
        ct = ContentType.objects.get_for_model(Invoice)
        return Document.objects.filter(
            account_id=invoice.account_id,
            content_type_related=ct,
            object_id=str(invoice.pk),
            is_deleted=False,
        ).order_by("-created_at")

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = self.get_invoice(pk)
        qs = self.get_document_queryset(invoice)
        serializer = InvoiceDocumentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = self.get_invoice(pk)
        if invoice.account_id not in user_account_ids(request):
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
            account=invoice.account,
            content_type_related=ContentType.objects.get_for_model(Invoice),
            object_id=str(invoice.pk),
            file=file_obj,
            name=name[:255],
            filename=file_obj.name[:255],
            description=description,
            uploaded_by=request.user,
        )
        serializer = InvoiceDocumentListSerializer(
            doc, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvoiceDocumentDownloadAPIView(APIView):
    """GET: stream an invoice document as attachment. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = get_invoice_queryset(request).filter(pk=pk).first()
        if not invoice:
            return Response(
                {"detail": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if invoice.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Invoice)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=invoice.account_id,
            content_type_related=ct,
            object_id=str(invoice.pk),
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


class InvoiceDocumentDestroyAPIView(APIView):
    """DELETE (soft-delete) an invoice document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice = get_invoice_queryset(request).filter(pk=pk).first()
        if not invoice:
            return Response(
                {"detail": "Invoice not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if invoice.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Invoice)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=invoice.account_id,
            content_type_related=ct,
            object_id=str(invoice.pk),
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
