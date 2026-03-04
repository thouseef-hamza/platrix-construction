from rest_framework import serializers

from .models import Material


class MaterialListSerializer(serializers.ModelSerializer):
    """List/read material with unit display."""

    unit_display = serializers.CharField(
        source="get_unit_display", read_only=True
    )

    class Meta:
        model = Material
        fields = (
            "id",
            "account",
            "name",
            "code",
            "unit",
            "unit_display",
            "rate",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class MaterialWriteSerializer(serializers.ModelSerializer):
    """Create/update material."""

    class Meta:
        model = Material
        fields = (
            "id",
            "account",
            "name",
            "code",
            "unit",
            "rate",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
