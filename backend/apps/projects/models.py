from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import PROJECT_STATUS_CHOICES, PROJECT_TYPE_CHOICES


class Project(BaseModel):
    """
    Project scoped by tenant account. Linked to a client (Company).
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="projects",
        db_index=True,
    )
    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=64, db_index=True)
    client = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
        db_index=True,
    )
    project_type = models.IntegerField(
        choices=PROJECT_TYPE_CHOICES,
        db_index=True,
    )
    status = models.IntegerField(
        choices=PROJECT_STATUS_CHOICES,
        db_index=True,
    )
    location = models.CharField(max_length=512, blank=True)
    contract_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    budget = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "projects_project"
        ordering = ["-start_date", "code"]
        indexes = [
            models.Index(fields=["account", "code"]),
            models.Index(fields=["account", "status"]),
            models.Index(fields=["account", "is_deleted"]),
            models.Index(fields=["client", "status"]),
        ]
        unique_together = [["account", "code"]]
        verbose_name_plural = "projects"

    def __str__(self):
        return f"{self.code} – {self.name}"
