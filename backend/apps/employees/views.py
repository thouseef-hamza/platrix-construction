from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountUser
from apps.core.models import Document

from .constants import SALARY_ENTRY_STATUS_DRAFT
from .models import Employee, EmployeeSalaryEntry, EmployeeTransaction
from .serializers import (
    EmployeeDetailSerializer,
    EmployeeDocumentListSerializer,
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


class EmployeeSalaryDetailAPIView(APIView):
    """PATCH and DELETE a salary entry. Only draft entries can be edited or deleted."""

    permission_classes = [IsAuthenticated]

    def get_entry(self, employee_pk, entry_pk):
        employee = get_object_or_404(
            get_employee_queryset(self.request), pk=employee_pk
        )
        entry = get_object_or_404(
            employee.salary_entries.filter(is_deleted=False),
            pk=entry_pk,
        )
        return entry

    def patch(self, request, pk, entry_pk):
        entry = self.get_entry(pk, entry_pk)
        if entry.employee.account_id not in user_account_ids(request):
            raise PermissionDenied("You do not have access to this account.")
        if entry.status != SALARY_ENTRY_STATUS_DRAFT:
            raise ValidationError(
                {"status": "Only draft salary entries can be edited."}
            )
        serializer = EmployeeSalaryEntryWriteSerializer(
            entry, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EmployeeSalaryEntryReadSerializer(entry).data)

    def delete(self, request, pk, entry_pk):
        entry = self.get_entry(pk, entry_pk)
        if entry.employee.account_id not in user_account_ids(request):
            raise PermissionDenied("You do not have access to this account.")
        if entry.status != SALARY_ENTRY_STATUS_DRAFT:
            raise ValidationError(
                {"status": "Only draft salary entries can be deleted."}
            )
        entry.is_deleted = True
        entry.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class EmployeeDocumentListCreateAPIView(APIView):
    """GET list documents for an employee, POST upload a document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get_employee(self, pk):
        qs = get_employee_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get_document_queryset(self, employee):
        ct = ContentType.objects.get_for_model(Employee)
        return Document.objects.filter(
            account_id=employee.account_id,
            content_type_related=ct,
            object_id=str(employee.pk),
            is_deleted=False,
        ).order_by("-created_at")

    def get(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        employee = self.get_employee(pk)
        qs = self.get_document_queryset(employee)
        serializer = EmployeeDocumentListSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        employee = self.get_employee(pk)
        if employee.account_id not in user_account_ids(request):
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
            account=employee.account,
            content_type_related=ContentType.objects.get_for_model(Employee),
            object_id=str(employee.pk),
            file=file_obj,
            name=name[:255],
            filename=file_obj.name[:255],
            description=description,
            uploaded_by=request.user,
        )
        serializer = EmployeeDocumentListSerializer(
            doc, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployeeDocumentDownloadAPIView(APIView):
    """GET: stream an employee document as attachment (direct download). Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        employee = get_employee_queryset(request).filter(pk=pk).first()
        if not employee:
            return Response(
                {"detail": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if employee.account_id not in user_account_ids(request):
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Employee)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=employee.account_id,
            content_type_related=ct,
            object_id=str(employee.pk),
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


class EmployeeDocumentDestroyAPIView(APIView):
    """DELETE (soft-delete) an employee document. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, doc_pk):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        employee = get_employee_queryset(request).filter(pk=pk).first()
        if not employee:
            return Response(
                {"detail": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if employee.account_id not in user_account_ids(request):
            raise PermissionDenied("You do not have access to this account.")
        ct = ContentType.objects.get_for_model(Employee)
        doc = Document.objects.filter(
            pk=doc_pk,
            account_id=employee.account_id,
            content_type_related=ct,
            object_id=str(employee.pk),
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
