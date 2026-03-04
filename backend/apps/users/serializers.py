from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.constants import ACCOUNT_USER_ROLE_CHOICES
from apps.accounts.models import AccountUser

from .models import User


class LoginSerializer(serializers.Serializer):
    """Email and password for login."""

    email = serializers.EmailField(required=True, write_only=True)
    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})


class AccountSummarySerializer(serializers.Serializer):
    """Minimal account data for login response (account + role for this user)."""

    id = serializers.UUIDField(source="account.id")
    name = serializers.CharField(source="account.name")
    status = serializers.IntegerField(source="account.status")
    role = serializers.IntegerField()
    role_display = serializers.SerializerMethodField()

    def get_role_display(self, obj):
        return dict(ACCOUNT_USER_ROLE_CHOICES).get(obj.role, "")


class UserSummarySerializer(serializers.ModelSerializer):
    """User fields to return in login response."""

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
        )
        read_only_fields = fields
