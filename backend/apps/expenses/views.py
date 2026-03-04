from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.accounts.models import AccountUser

from .models import Expense, ExpensePayment
from .serializers import (
    ExpenseDetailSerializer,
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
        "account", "payee", "project"
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
        serializer = ExpensePaymentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(expense=expense)
        _recompute_payment_status(expense)
        return Response(
            ExpensePaymentReadSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )
