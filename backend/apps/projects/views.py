from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account, AccountUser
from apps.core.models import Document

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
