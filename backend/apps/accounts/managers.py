from apps.core.models import SoftDeleteManager


class AccountManager(SoftDeleteManager):
    """Manager for Account model; excludes soft-deleted accounts by default."""

    pass
