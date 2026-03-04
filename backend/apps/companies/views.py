from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account, AccountUser

from .models import Company
from .serializers import CompanyListSerializer, CompanyWriteSerializer


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


def get_company_queryset(request):
    account_ids = user_account_ids(request)
    qs = Company.objects.filter(account_id__in=account_ids).select_related("account")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    company_type = request.query_params.get("company_type")
    if company_type is not None and company_type != "":
        try:
            qs = qs.filter(company_type=int(company_type))
        except ValueError:
            pass
    return qs.order_by("name")


class CompanyListCreateView(APIView):
    """GET list, POST create companies. Requires x-account-id header. Query param: company_type (0=Client, 1=Supplier, 2=Subcontractor)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_company_queryset(request)
        serializer = CompanyListSerializer(qs, many=True)
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
        serializer = CompanyWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            CompanyListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class CompanyDetailView(APIView):
    """GET, PUT, PATCH, DELETE a single company."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_company_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = CompanyListSerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = CompanyWriteSerializer(obj, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(CompanyListSerializer(serializer.instance).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = CompanyWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(CompanyListSerializer(serializer.instance).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
