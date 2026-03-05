"""
Middleware that reads x-account-id header and sets request.current_account_id (int or None).
For all API requests except authentication URLs, x-account-id is required and must be a valid integer.
Views must validate that the user has access to this account (e.g. via user_account_ids).
"""

from django.http import JsonResponse


def _require_account_id(request):
    """Return True if this request must have x-account-id (API but not auth)."""
    path = (request.path or "").strip("/")
    if not path.startswith("api/"):
        return False
    if path.startswith("api/auth/"):
        return False
    return True


def account_header_middleware(get_response):
    def middleware(request):
        request.current_account_id = None
        raw = request.headers.get("x-account-id") or request.META.get("HTTP_X_ACCOUNT_ID")

        if raw is not None and raw != "":
            try:
                request.current_account_id = int(raw.strip())
            except ValueError:
                request.current_account_id = None

        if _require_account_id(request):
            if request.current_account_id is None:
                return JsonResponse(
                    {"detail": "x-account-id header is required and must be a valid account id."},
                    status=400,
                )

        return get_response(request)

    return middleware
