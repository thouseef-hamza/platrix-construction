from rest_framework import serializers

from .models import Company


class CompanyListSerializer(serializers.ModelSerializer):
    """List/read company with type display."""

    company_type_display = serializers.CharField(
        source="get_company_type_display", read_only=True
    )

    class Meta:
        model = Company
        fields = (
            "id",
            "account",
            "name",
            "company_type",
            "company_type_display",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CompanyWriteSerializer(serializers.ModelSerializer):
    """Create/update company."""

    class Meta:
        model = Company
        fields = (
            "id",
            "account",
            "name",
            "company_type",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
