from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountUser
from apps.core.models import Document

from .models import Purchase, PurchasePayment
from .serializers import (
    PurchaseDetailSerializer,
    PurchaseDocumentListSerializer,
    PurchaseListSerializer,
    PurchasePaymentReadSerializer,
    PurchasePaymentWriteSerializer,
    PurchaseWriteSerializer,
    _recompute_payment_status,
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


def get_purchase_queryset(request):
    account_ids = user_account_ids(request)
    qs = Purchase.objects.filter(account_id__in=account_ids).select_related(
        "account", "supplier", "project"
    ).prefetch_related("line_items__material", "payments")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-date", "-created_at")


class PurchaseListCreateAPIView(APIView):
    """GET list, POST create purchases. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_purchase_queryset(request)
        serializer = PurchaseListSerializer(qs, many=True)
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
        serializer = PurchaseWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            PurchaseListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class PurchaseDetailAPIView(APIView):
    """GET one, PATCH update (draft only). No delete."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_purchase_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = PurchaseDetailSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = PurchaseWriteSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(PurchaseDetailSerializer(serializer.instance).data)


class PurchasePaymentListCreateAPIView(APIView):
    """GET list payments for a purchase, POST add a payment. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_purchase(self, pk):
        qs = get_purchase_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = self.get_purchase(pk)
        payments = purchase.payments.filter(is_deleted=False).order_by("-date", "id")
        serializer = PurchasePaymentReadSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = self.get_purchase(pk)
        if purchase.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer = PurchasePaymentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(purchase=purchase)
        _recompute_payment_status(purchase)
        return Response(
            PurchasePaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class PurchaseDocumentListCreateAPIView(APIView):
    """GET list documents for a purchase, POST upload a document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_purchase(self, pk):
        qs = get_purchase_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get_document_queryset(self, purchase):
        ct = ContentType.objects.get_for_model(Purchase)
        return Document.objects.filter(
            account_id=purchase.account_id,
            content_type_related=ct,
            object_id=str(purchase.pk),
            is_deleted=False,
        ).order_by("-created_at")

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = self.get_purchase(pk)
        qs = self.get_document_queryset(purchase)
        serializer = PurchaseDocumentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = self.get_purchase(pk)
        if purchase.account_id not in user_account_ids(request):
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
            account=purchase.account,
            content_type_related=ContentType.objects.get_for_model(Purchase),
            object_id=str(purchase.pk),
            file=file_obj,
            name=name[:255],
            filename=file_obj.name[:255],
            description=description,
            uploaded_by=request.user,
        )
        serializer = PurchaseDocumentListSerializer(
            doc, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PurchaseDocumentDownloadAPIView(APIView):
    """GET: stream a purchase document as attachment (direct download). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = get_purchase_queryset(request).filter(pk=pk).first()
        if not purchase:
            return Response(
                {"detail": "Purchase not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if purchase.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Purchase)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=purchase.account_id,
            content_type_related=ct,
            object_id=str(purchase.pk),
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


class PurchaseDocumentDestroyAPIView(APIView):
    """DELETE (soft-delete) a purchase document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        purchase = get_purchase_queryset(request).filter(pk=pk).first()
        if not purchase:
            return Response(
                {"detail": "Purchase not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if purchase.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Purchase)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=purchase.account_id,
            content_type_related=ct,
            object_id=str(purchase.pk),
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
