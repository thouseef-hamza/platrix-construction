from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account, AccountUser

from .models import ChartOfAccount, LedgerEntry, get_next_entry_number
from .serializers import (
    ChartOfAccountListSerializer,
    ChartOfAccountWriteSerializer,
    LedgerEntrySerializer,
    LedgerEntryWriteSerializer,
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


def get_chart_of_account_queryset(request):
    account_ids = user_account_ids(request)
    qs = ChartOfAccount.objects.filter(account_id__in=account_ids).select_related(
        "account", "parent"
    )
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("code")


def get_journal_entry_queryset(request):
    account_ids = user_account_ids(request)
    qs = LedgerEntry.objects.filter(account_id__in=account_ids).select_related(
        "account", "created_by", "posted_by"
    ).prefetch_related("lines__chart_of_account")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-posting_date", "-created_at")


class ChartOfAccountListCreateView(APIView):
    """GET list, POST create chart of accounts. Requires x-account-id header for scoping."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_chart_of_account_queryset(request)
        serializer = ChartOfAccountListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account = get_object_or_404(Account, pk=account_id)
        serializer = ChartOfAccountWriteSerializer(
            data={**request.data, "account": account_id}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            ChartOfAccountListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class ChartOfAccountDetailView(APIView):
    """GET, PUT, PATCH, DELETE a single chart of account."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_chart_of_account_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = ChartOfAccountListSerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = ChartOfAccountWriteSerializer(obj, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(ChartOfAccountListSerializer(serializer.instance).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = ChartOfAccountWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(ChartOfAccountListSerializer(serializer.instance).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JournalEntryListCreateView(APIView):
    """GET list, POST create journal entries. Requires x-account-id header. POST can omit entry_number."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_journal_entry_queryset(request)
        serializer = LedgerEntrySerializer(qs, many=True)
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
        serializer = LedgerEntryWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        entry_number = serializer.validated_data.get("entry_number")
        if not entry_number:
            serializer.validated_data["entry_number"] = get_next_entry_number(account)
        if request.user:
            serializer.validated_data["created_by"] = request.user
        serializer.save()
        return Response(
            LedgerEntrySerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class JournalEntryDetailView(APIView):
    """GET, PUT, PATCH, DELETE a single journal entry."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_journal_entry_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = LedgerEntrySerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = LedgerEntryWriteSerializer(obj, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(LedgerEntrySerializer(serializer.instance).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = LedgerEntryWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(LedgerEntrySerializer(serializer.instance).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class JournalEntryNextNumberView(APIView):
    """GET with x-account-id header → { "entry_number": "JE-2025-00001" }."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        account = get_object_or_404(Account, pk=account_id)
        entry_number = get_next_entry_number(account)
        return Response({"entry_number": entry_number})
