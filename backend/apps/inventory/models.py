from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import UNIT_CHOICES


class Material(BaseModel):
    """
    Material/item scoped by tenant account. Used in inventory, purchases, etc.
    """

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="materials",
        db_index=True,
    )
    name = models.CharField(max_length=255, db_index=True)
    code = models.CharField(max_length=64, db_index=True)
    unit = models.IntegerField(
        choices=UNIT_CHOICES,
        db_index=True,
    )
    rate = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Unit rate/price",
    )

    class Meta:
        db_table = "inventory_material"
        ordering = ["code"]
        indexes = [
            models.Index(fields=["account", "code"]),
            models.Index(fields=["account", "is_deleted"]),
        ]
        unique_together = [["account", "code"]]
        verbose_name_plural = "materials"

    def __str__(self):
        return f"{self.code} – {self.name}"
