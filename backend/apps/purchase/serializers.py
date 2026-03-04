from decimal import Decimal

from rest_framework import serializers

from apps.core.models import Document

from .constants import (
    PAYMENT_STATUS_COMPLETED,
    PAYMENT_STATUS_NOT_COMPLETED,
    PAYMENT_STATUS_PARTIAL,
    PURCHASE_STATUS_DRAFT,
    PURCHASE_STATUS_POSTED,
)
from .models import Purchase, PurchaseLineItem, PurchasePayment


class PurchaseLineItemReadSerializer(serializers.ModelSerializer):
    """Read-only line item with material details."""

    material_id = serializers.IntegerField(source="material.id", read_only=True)
    material_name = serializers.CharField(source="material.name", read_only=True)
    material_code = serializers.CharField(source="material.code", read_only=True)
    unit = serializers.IntegerField(source="material.unit", read_only=True)
    unit_display = serializers.CharField(
        source="material.get_unit_display", read_only=True
    )

    class Meta:
        model = PurchaseLineItem
        fields = (
            "id",
            "material_id",
            "material_name",
            "material_code",
            "unit",
            "unit_display",
            "quantity",
            "rate",
            "amount",
        )


class PurchaseLineItemWriteSerializer(serializers.ModelSerializer):
    """Create/update a line item (material, quantity, rate; amount computed)."""

    class Meta:
        model = PurchaseLineItem
        fields = ("id", "material", "quantity", "rate", "amount")
        read_only_fields = ("id", "amount")

    def validate_quantity(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Quantity must be positive.")
        return value

    def validate_rate(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Rate cannot be negative.")
        return value


class PurchasePaymentReadSerializer(serializers.ModelSerializer):
    """Read-only payment."""

    class Meta:
        model = PurchasePayment
        fields = ("id", "date", "amount", "reference", "created_at")


class PurchasePaymentWriteSerializer(serializers.ModelSerializer):
    """Create a payment against a purchase."""

    class Meta:
        model = PurchasePayment
        fields = ("date", "amount", "reference")

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class PurchaseListSerializer(serializers.ModelSerializer):
    """List purchase with display fields and related names."""

    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    supplier_id = serializers.IntegerField(source="supplier.id", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Purchase
        fields = (
            "id",
            "account",
            "supplier_id",
            "supplier_name",
            "project_id",
            "project_name",
            "reference",
            "date",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "amount",
            "paid_amount",
            "description",
            "paid_at",
            "created_at",
            "updated_at",
        )


class PurchaseDetailSerializer(serializers.ModelSerializer):
    """Full purchase with line_items and payments."""

    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    supplier_id = serializers.IntegerField(source="supplier.id", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )
    line_items = PurchaseLineItemReadSerializer(many=True, read_only=True)
    payments = PurchasePaymentReadSerializer(many=True, read_only=True)

    class Meta:
        model = Purchase
        fields = (
            "id",
            "account",
            "supplier_id",
            "supplier_name",
            "project_id",
            "project_name",
            "reference",
            "date",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "amount",
            "paid_amount",
            "description",
            "paid_at",
            "line_items",
            "payments",
            "created_at",
            "updated_at",
        )


class PurchaseWriteSerializer(serializers.ModelSerializer):
    """Create/update purchase with nested line_items."""

    line_items = PurchaseLineItemWriteSerializer(many=True)
    paid_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
        help_text="Optional initial paid amount on create; creates a payment and updates payment status.",
    )

    class Meta:
        model = Purchase
        fields = (
            "id",
            "account",
            "supplier",
            "project",
            "reference",
            "date",
            "status",
            "payment_method",
            "amount",
            "paid_amount",
            "payment_status",
            "description",
            "line_items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "amount", "payment_status", "created_at", "updated_at")

    def validate_line_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one line item is required."
            )
        return value

    def validate(self, attrs):
        account_id = attrs.get("account")
        if account_id is not None:
            account_id = getattr(account_id, "pk", account_id)
        supplier = attrs.get("supplier")
        project = attrs.get("project")
        if supplier and getattr(supplier, "account_id", None) != account_id:
            raise serializers.ValidationError(
                {"supplier": "Supplier must belong to the same account."}
            )
        if project and getattr(project, "account_id", None) != account_id:
            raise serializers.ValidationError(
                {"project": "Project must belong to the same account."}
            )
        line_items = attrs.get("line_items", [])
        for i, line in enumerate(line_items):
            mat = line.get("material")
            if mat and getattr(mat, "account_id", None) != account_id:
                raise serializers.ValidationError(
                    {"line_items": f"Line {i + 1}: material must belong to the same account."}
                )
        return attrs

    def create(self, validated_data):
        line_items_data = validated_data.pop("line_items")
        initial_paid = validated_data.pop("paid_amount", None)
        purchase = Purchase.objects.create(
            **validated_data,
            amount=Decimal("0.00"),
            paid_amount=Decimal("0.00"),
        )
        total = Decimal("0.00")
        for line_data in line_items_data:
            qty = line_data.get("quantity", 0)
            rate = line_data.get("rate", 0)
            amount = qty * rate
            total += amount
            PurchaseLineItem.objects.create(
                purchase=purchase,
                material=line_data["material"],
                quantity=qty,
                rate=rate,
                amount=amount,
            )
        purchase.amount = total
        purchase.save(update_fields=["amount"])
        if initial_paid is not None and initial_paid > 0:
            PurchasePayment.objects.create(
                purchase=purchase,
                date=purchase.date,
                amount=initial_paid,
                reference="",
            )
            _recompute_payment_status(purchase)
        return purchase

    def update(self, instance, validated_data):
        if instance.status == PURCHASE_STATUS_POSTED:
            raise serializers.ValidationError(
                "Posted purchases cannot be edited."
            )
        validated_data.pop("paid_amount", None)  # ignore if sent; computed from payments
        line_items_data = validated_data.pop("line_items", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if line_items_data is not None:
            if instance.status != PURCHASE_STATUS_DRAFT:
                raise serializers.ValidationError(
                    "Only draft purchases can have line items updated."
                )
            instance.line_items.all().delete()
            total = Decimal("0.00")
            for line_data in line_items_data:
                qty = line_data.get("quantity", 0)
                rate = line_data.get("rate", 0)
                amount = qty * rate
                total += amount
                PurchaseLineItem.objects.create(
                    purchase=instance,
                    material=line_data["material"],
                    quantity=qty,
                    rate=rate,
                    amount=amount,
                )
            instance.amount = total
        instance.save()
        return instance


def _recompute_payment_status(purchase):
    """Update purchase.paid_amount and payment_status from payments."""
    from django.db.models import Sum
    from .models import PurchasePayment

    total_paid = (
        PurchasePayment.objects.filter(
            purchase=purchase, is_deleted=False
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0.00")
    )
    purchase.paid_amount = total_paid
    if total_paid >= purchase.amount:
        purchase.payment_status = PAYMENT_STATUS_COMPLETED
    elif total_paid > 0:
        purchase.payment_status = PAYMENT_STATUS_PARTIAL
    else:
        purchase.payment_status = PAYMENT_STATUS_NOT_COMPLETED
    purchase.save(update_fields=["paid_amount", "payment_status"])


class PurchaseDocumentListSerializer(serializers.ModelSerializer):
    """List document for a purchase (read-only)."""

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = (
            "id",
            "name",
            "filename",
            "file_url",
            "size",
            "description",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
