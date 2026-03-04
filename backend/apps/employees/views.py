from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.accounts.models import AccountUser

from .models import Employee, EmployeeSalaryEntry, EmployeeTransaction
from .serializers import (
    EmployeeDetailSerializer,
    EmployeeListSerializer,
    EmployeeSalaryEntryReadSerializer,
    EmployeeSalaryEntryWriteSerializer,
    EmployeeTransactionReadSerializer,
    EmployeeTransactionWriteSerializer,
    EmployeeWriteSerializer,
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


def get_employee_queryset(request):
    account_ids = user_account_ids(request)
    qs = Employee.objects.filter(account_id__in=account_ids)
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("-created_at")


class EmployeeListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_employee_queryset(request)
        serializer = EmployeeListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        account_id = _current_account_id(request)
        if account_id is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from apps.accounts.models import Account

        account = get_object_or_404(Account, pk=account_id)
        data = {**request.data, "account": account_id}
        serializer = EmployeeWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            EmployeeDetailSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class EmployeeDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_employee_queryset(self.request).prefetch_related(
            "salary_entries", "transactions"
        )
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = EmployeeDetailSerializer(obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer = EmployeeWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeDetailSerializer(serializer.instance).data)


class EmployeeSalaryListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_employee(self, pk):
        qs = get_employee_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        employee = self.get_employee(pk)
        entries = employee.salary_entries.filter(is_deleted=False).order_by(
            "-date", "-id"
        )
        serializer = EmployeeSalaryEntryReadSerializer(entries, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        employee = self.get_employee(pk)
        if employee.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer = EmployeeSalaryEntryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(employee=employee)
        return Response(
            EmployeeSalaryEntryReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class EmployeeTransactionListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_employee(self, pk):
        qs = get_employee_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        employee = self.get_employee(pk)
        transactions = employee.transactions.filter(is_deleted=False).order_by(
            "-date", "-id"
        )
        serializer = EmployeeTransactionReadSerializer(transactions, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        employee = self.get_employee(pk)
        if employee.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer = EmployeeTransactionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(employee=employee)
        return Response(
            EmployeeTransactionReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )
