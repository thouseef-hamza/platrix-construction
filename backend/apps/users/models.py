from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as primary authentication."""

    # PRIMARY AUTHENTICATION: Email (Required, Unique)
    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
        help_text="Email address used for authentication",
    )

    # Authentication fields
    password = models.CharField(_("password"), max_length=128, default="", blank=True)
    sign_in_count = models.IntegerField(default=0, db_index=True)

    # User information
    name = models.CharField(max_length=255, db_index=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Status
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Django auth fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users_user"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name or self.email

    def get_short_name(self):
        if self.name and self.name.strip():
            return self.name.split()[0]
        return self.email
