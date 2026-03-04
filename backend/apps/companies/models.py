from django.db import models

from apps.core.models import BaseModel

from .constants import COMPANY_TYPE_CHOICES


class Company(BaseModel):
    """
    Company (client, supplier, or subcontractor) scoped by tenant account.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="companies",
        db_index=True,
    )
    name = models.CharField(max_length=255, db_index=True)
    company_type = models.IntegerField(
        choices=COMPANY_TYPE_CHOICES,
        db_index=True,
    )


    class Meta:
        db_table = "companies_company"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["account", "company_type"]),
            models.Index(fields=["account", "is_deleted"]),
        ]
        verbose_name_plural = "companies"

    def __str__(self):
        return self.name
