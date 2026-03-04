from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import AccountUser

from .models import User
from .serializers import AccountSummarySerializer, LoginSerializer, UserSummarySerializer


class RefreshTokenView(APIView):
    """
    POST with { "refresh": "<refresh_token>" }.
    Returns { "token": access_token, "refresh": refresh_token }.
    Use when the access token has expired to get a new one without re-login.
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request: Request) -> Response:
        refresh_str = request.data.get("refresh")
        if not refresh_str:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            refresh = RefreshToken(refresh_str)
            access = str(refresh.access_token)
            return Response(
                {"token": access, "refresh": str(refresh)},
                status=status.HTTP_200_OK,
            )
        except (InvalidToken, TokenError):
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LoginView(APIView):
    """
    POST with { "email": "...", "password": "..." }.
    Returns { "token": access_token, "refresh": refresh_token, "user": {...}, "accounts": [...] }.
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request=request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"detail": "User account is disabled."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        account_users = (
            AccountUser.objects.filter(user=user, is_deleted=False)
            .select_related("account")
            .order_by("account__name")
        )
        accounts_data = AccountSummarySerializer(account_users, many=True).data

        return Response(
            {
                "token": access,
                "refresh": str(refresh),
                "user": UserSummarySerializer(user).data,
                "accounts": accounts_data,
            },
            status=status.HTTP_200_OK,
        )
