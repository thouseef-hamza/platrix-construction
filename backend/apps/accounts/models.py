from django.db import models

from apps.accounts.constants import (
    ACCOUNT_STATUS_CHOICES,
    ACCOUNT_USER_AVAILABILITY_CHOICES,
    ACCOUNT_USER_ROLE_CHOICES,
)
from apps.accounts.managers import AccountManager
from apps.core.models import BaseModel


class Account(BaseModel):
    """
    Account model for multi-tenant support.
    """

    # STATUS_CHOICES moved to apps.accounts.constants.ACCOUNT_STATUS_CHOICES
    STATUS_CHOICES = ACCOUNT_STATUS_CHOICES  # DO NOT EDIT: Use constants.py

    # Note: id field is inherited from BaseModel as UUIDField
    # If you need to change to integer, you'll need a proper data migration that:
    # 1. Creates a new integer field
    # 2. Populates it with sequential integers
    # 3. Updates all foreign keys
    # 4. Drops the old UUID field
    # 5. Renames the new field to id

    name = models.CharField(max_length=255, db_index=True)
    support_email = models.EmailField(max_length=100, blank=True)
    status = models.IntegerField(default=0, choices=STATUS_CHOICES, db_index=True)

    objects = AccountManager()

    class Meta:
        db_table = "accounts_account"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["status", "is_deleted"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def is_active(self):
        """Check if account is active."""
        return self.status == 0 and not self.is_deleted

    def get_users(self):
        """Get all users for this account."""
        return self.account_users.filter(is_deleted=False).select_related("user")

    def get_active_users(self):
        """Get active users for this account."""
        return self.account_users.filter(
            is_deleted=False,
            availability=1,  # 1 = Online
        ).select_related("user")


class AccountUser(BaseModel):
    """Junction table for Account-User many-to-many relationship."""

    # ROLE_CHOICES moved to apps.accounts.constants.ACCOUNT_USER_ROLE_CHOICES
    ROLE_CHOICES = ACCOUNT_USER_ROLE_CHOICES  # DO NOT EDIT: Use constants.py

    # AVAILABILITY_CHOICES moved to apps.accounts.constants.ACCOUNT_USER_AVAILABILITY_CHOICES
    AVAILABILITY_CHOICES = ACCOUNT_USER_AVAILABILITY_CHOICES  # DO NOT EDIT: Use constants.py

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="account_users",
        db_index=True,
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="account_users",
        db_index=True,
    )
    role = models.IntegerField(default=0, choices=ROLE_CHOICES, db_index=True)
    active_at = models.DateTimeField(null=True, blank=True)
    availability = models.IntegerField(
        default=0, choices=AVAILABILITY_CHOICES, db_index=True
    )

    class Meta:
        db_table = "accounts_accountuser"
        unique_together = [["account", "user"]]
        indexes = [
            models.Index(fields=["account", "user"]),
            models.Index(fields=["role"]),
            models.Index(fields=["availability"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.account.name} – {self.user.email}"
