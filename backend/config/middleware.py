"""
Middleware that reads a-account-id header and sets request.current_account_id (int or None).
Views must validate that the user has access to this account (e.g. via user_account_ids).
"""


def account_header_middleware(get_response):
    def middleware(request):
        request.current_account_id = None
        raw = request.headers.get("a-account-id") or request.META.get("HTTP_A_ACCOUNT_ID")
        if raw is not None and raw != "":
            try:
                request.current_account_id = int(raw.strip())
            except ValueError:
                pass
        return get_response(request)

    return middleware
