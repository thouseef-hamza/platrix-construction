from rest_framework import serializers

from apps.core.models import Document

from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    """List/read project with type, status and client display."""

    project_type_display = serializers.CharField(
        source="get_project_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    client_name = serializers.CharField(
        source="client.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Project
        fields = (
            "id",
            "account",
            "name",
            "code",
            "client",
            "client_name",
            "project_type",
            "project_type_display",
            "status",
            "status_display",
            "location",
            "contract_value",
            "budget",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProjectWriteSerializer(serializers.ModelSerializer):
    """Create/update project."""

    class Meta:
        model = Project
        fields = (
            "id",
            "account",
            "name",
            "code",
            "client",
            "project_type",
            "status",
            "location",
            "contract_value",
            "budget",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ProjectDocumentListSerializer(serializers.ModelSerializer):
    """List document for a project (read-only)."""

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            "id",
            "name",
            "filename",
            "file_url",
            "size",
            "description",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
