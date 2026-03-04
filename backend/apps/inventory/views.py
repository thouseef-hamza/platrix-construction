from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account, AccountUser

from .models import Material
from .serializers import MaterialListSerializer, MaterialWriteSerializer


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


def get_material_queryset(request):
    account_ids = user_account_ids(request)
    qs = Material.objects.filter(account_id__in=account_ids).select_related("account")
    account_id = _current_account_id(request)
    if account_id is not None:
        qs = qs.filter(account_id=account_id)
    return qs.order_by("code")


class MaterialListCreateView(APIView):
    """GET list, POST create materials. Requires x-account-id header."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _current_account_id(request) is None:
            return Response(
                {"detail": "x-account-id header is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = get_material_queryset(request)
        serializer = MaterialListSerializer(qs, many=True)
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
        serializer = MaterialWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(account=account)
        return Response(
            MaterialListSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class MaterialDetailView(APIView):
    """GET, PUT, PATCH, DELETE a single material."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        qs = get_material_queryset(self.request)
        return get_object_or_404(qs, pk=pk)

    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer = MaterialListSerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = MaterialWriteSerializer(obj, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(MaterialListSerializer(serializer.instance).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        serializer = MaterialWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.instance.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        serializer.save()
        return Response(MaterialListSerializer(serializer.instance).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if obj.account_id not in user_account_ids(request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have access to this account.")
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
