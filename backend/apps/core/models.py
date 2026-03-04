import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.constants import ACTIVITY_LOG_ACTION_FLAG_CHOICES


def document_upload_to(instance, filename):
    """Upload path for documents: documents/<year>/<month>/<id>_<filename>."""
    from django.utils import timezone

    now = timezone.now()
    prefix = str(instance.pk) if instance.pk else uuid.uuid4().hex[:12]
    return f"documents/{now.year}/{now.month:02d}/{prefix}_{filename}"


class SoftDeleteQuerySet(models.QuerySet):
    """QuerySet that excludes soft-deleted records by default."""

    def with_deleted(self):
        return self.all()

    def deleted_only(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records by default."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)


class BaseModel(models.Model):
    """
    Abstract base model with integer (BigAuto) primary key and soft-delete support.
    """

    id = models.BigAutoField(primary_key=True, auto_created=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()

    class Meta:
        abstract = True


class ActivityLogManager(models.Manager):
    """Manager for ActivityLog with helper to create log entries."""

    def log_action(
        self,
        user_id,
        content_type_id,
        object_id,
        object_repr,
        action_flag,
        account_id=None,
        change_message="",
        extra_data=None,
    ):
        """
        Create an activity log entry.

        :param user_id: PK of the user who performed the action
        :param content_type_id: ContentType pk for the target model
        :param object_id: str ID of the target object
        :param object_repr: str representation of the object
        :param action_flag: ACTIVITY_LOG_ADDITION | CHANGE | DELETION
        :param account_id: optional Account pk for tenant scoping
        :param change_message: optional description of the change
        :param extra_data: optional dict (e.g. request info) stored as JSON
        """
        from django.utils import timezone

        return self.create(
            action_time=timezone.now(),
            account_id=account_id,
            user_id=user_id,
            content_type_id=content_type_id,
            object_id=str(object_id),
            object_repr=object_repr[:200] if object_repr else "",
            action_flag=action_flag,
            change_message=change_message or "",
            extra_data=extra_data or {},
        )


class ActivityLog(models.Model):
    """
    Client-facing audit log: who did what, when, on which object.
    Optional account/tenant scoping. Not soft-deleted (append-only audit trail).
    """

    action_time = models.DateTimeField(db_index=True)
    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activity_logs",
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_logs",
        db_index=True,
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="activity_logs",
        db_index=True,
    )
    object_id = models.CharField(max_length=255, db_index=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField(
        choices=ACTIVITY_LOG_ACTION_FLAG_CHOICES, db_index=True
    )
    change_message = models.TextField(blank=True)
    extra_data = models.JSONField(default=dict, blank=True)

    objects = ActivityLogManager()

    class Meta:
        db_table = "core_activitylog"
        ordering = ["-action_time"]
        indexes = [
            models.Index(fields=["account", "action_time"]),
            models.Index(fields=["user", "action_time"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.get_action_flag_display()} – {self.object_repr} ({self.action_time})"


class Document(BaseModel):
    """
    Store documents and metadata: file, name, type, size, optional link to another model.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="documents",
        db_index=True,
    )
    file = models.FileField(upload_to=document_upload_to)
    name = models.CharField(max_length=255, blank=True)
    filename = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=255, blank=True)  # MIME type
    size = models.PositiveBigIntegerField(default=0)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
        db_index=True,
    )
    # Optional generic relation to another model
    content_type_related = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="core_documents",
        db_index=True,
    )
    object_id = models.CharField(max_length=255, blank=True, db_index=True)
    content_object = GenericForeignKey("content_type_related", "object_id")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "core_document"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["account", "created_at"]),
            models.Index(fields=["uploaded_by", "created_at"]),
            models.Index(fields=["content_type_related", "object_id"]),
        ]

    def __str__(self):
        return self.name or self.filename or str(self.file)

    def save(self, *args, **kwargs):
        if self.file:
            if not self.filename:
                self.filename = self.file.name
            if not self.name:
                self.name = self.filename
            self.size = self.file.size
            if not self.content_type and hasattr(self.file, "content_type"):
                # FileField doesn't set content_type; we could use python-magic or
                # rely on upload metadata. Leave content_type as set by caller if needed.
                pass
        super().save(*args, **kwargs)
