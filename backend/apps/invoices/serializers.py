import re
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from apps.core.models import Document

from .constants import (
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_POSTED,
    PAYMENT_LEDGER_DRAFT,
    PAYMENT_LEDGER_POSTED,
    PAYMENT_STATUS_COMPLETED,
    PAYMENT_STATUS_NOT_COMPLETED,
    PAYMENT_STATUS_PARTIAL,
)
from .models import Invoice, InvoicePayment


def _generate_invoice_reference(account, date, invoice_type):
    """Generate a unique reference INV-C- or INV-S- + YYYYMMDD-NNNN."""
    if hasattr(date, "strftime"):
        date_str = date.strftime("%Y%m%d")
    else:
        date_str = str(date).replace("-", "")[:8]
    account_id = getattr(account, "pk", account) if account else None
    prefix = "INV-C-" if invoice_type == 0 else "INV-S-"
    if account_id is None:
        return f"{prefix}{date_str}-0001"
    existing_refs = Invoice.objects.filter(
        account_id=account_id, date=date, invoice_type=invoice_type
    ).values_list("reference", flat=True)
    pattern = re.compile(r"^" + re.escape(prefix) + r"\d{8}-(\d{4})$")
    numbers = []
    for ref in existing_refs:
        if ref:
            m = pattern.match(ref.strip())
            if m:
                numbers.append(int(m.group(1)))
    next_seq = max(numbers, default=0) + 1
    return f"{prefix}{date_str}-{next_seq:04d}"


def _reference_is_empty(ref):
    if ref is None:
        return True
    s = (ref if isinstance(ref, str) else str(ref)).strip()
    return not s or s == "—" or s == "-"


class InvoicePaymentReadSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = InvoicePayment
        fields = ("id", "date", "amount", "reference", "status", "status_display", "created_at")


class InvoicePaymentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoicePayment
        fields = ("date", "amount", "reference", "status")
        extra_kwargs = {"status": {"default": PAYMENT_LEDGER_DRAFT}}

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        invoice = self.context.get("invoice") or (
            self.instance.invoice if self.instance else None
        )
        if not invoice:
            return attrs

        amount = attrs.get("amount")
        if amount is None and self.instance:
            amount = self.instance.amount
        if amount is None:
            return attrs

        amount = Decimal(str(amount))
        other_payments = invoice.payments.filter(is_deleted=False)
        if self.instance:
            other_payments = other_payments.exclude(pk=self.instance.pk)
        total_other = (
            other_payments.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        )
        invoice_amount = getattr(invoice, "amount", None) or Decimal("0.00")
        if isinstance(invoice_amount, (int, float)):
            invoice_amount = Decimal(str(invoice_amount))

        if total_other + amount > invoice_amount:
            raise serializers.ValidationError(
                {
                    "amount": "Payment amount cannot exceed the remaining balance due. "
                    "Total payments must not exceed the invoice amount."
                }
            )
        return attrs


class InvoiceListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    invoice_type_display = serializers.CharField(
        source="get_invoice_type_display", read_only=True
    )
    party_id = serializers.IntegerField(source="party.id", read_only=True)
    party_name = serializers.CharField(source="party.name", read_only=True)
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Invoice
        fields = (
            "id",
            "account",
            "invoice_type",
            "invoice_type_display",
            "party_id",
            "party_name",
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


class InvoiceDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    invoice_type_display = serializers.CharField(
        source="get_invoice_type_display", read_only=True
    )
    party_id = serializers.IntegerField(source="party.id", read_only=True)
    party_name = serializers.CharField(source="party.name", read_only=True)
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )
    payments = InvoicePaymentReadSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "account",
            "invoice_type",
            "invoice_type_display",
            "party_id",
            "party_name",
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
            "payments",
            "created_at",
            "updated_at",
        )


def _recompute_payment_status(invoice):
    total_paid = (
        InvoicePayment.objects.filter(
            invoice=invoice, is_deleted=False
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0.00")
    )
    invoice.paid_amount = total_paid
    if total_paid >= invoice.amount:
        invoice.payment_status = PAYMENT_STATUS_COMPLETED
    elif total_paid > 0:
        invoice.payment_status = PAYMENT_STATUS_PARTIAL
    else:
        invoice.payment_status = PAYMENT_STATUS_NOT_COMPLETED
    invoice.save(update_fields=["paid_amount", "payment_status"])


class InvoiceWriteSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Invoice
        fields = (
            "id",
            "account",
            "party",
            "invoice_type",
            "project",
            "reference",
            "date",
            "status",
            "payment_method",
            "amount",
            "paid_amount",
            "payment_status",
            "description",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "payment_status", "created_at", "updated_at")
        extra_kwargs = {"reference": {"required": False, "allow_blank": True}}

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate(self, attrs):
        account_id = attrs.get("account")
        if account_id is not None:
            account_id = getattr(account_id, "pk", account_id)
        elif self.instance is not None:
            account_id = getattr(self.instance, "account_id", None)
        party = attrs.get("party")
        project = attrs.get("project")
        if account_id is not None:
            if party and getattr(party, "account_id", None) != account_id:
                raise serializers.ValidationError(
                    {"party": "Party must belong to the same account."}
                )
            if project is not None and getattr(project, "account_id", None) != account_id:
                raise serializers.ValidationError(
                    {"project": "Project must belong to the same account."}
                )
        return attrs

    def create(self, validated_data):
        initial_paid = validated_data.pop("paid_amount", None)
        amount = validated_data.pop("amount", None) or Decimal("0.00")
        if _reference_is_empty(validated_data.get("reference")):
            validated_data["reference"] = _generate_invoice_reference(
                validated_data.get("account"),
                validated_data.get("date"),
                validated_data.get("invoice_type"),
            )
        invoice = Invoice.objects.create(
            **validated_data,
            amount=amount,
            paid_amount=Decimal("0.00"),
        )
        if invoice.status == INVOICE_STATUS_DRAFT:
            if initial_paid is not None:
                invoice.paid_amount = initial_paid
                invoice.save(update_fields=["paid_amount"])
        elif (
            initial_paid is not None
            and initial_paid > 0
            and invoice.status == INVOICE_STATUS_POSTED
        ):
            if initial_paid > invoice.amount:
                raise serializers.ValidationError(
                    {"paid_amount": "Paid amount cannot exceed total amount."}
                )
            InvoicePayment.objects.create(
                invoice=invoice,
                date=invoice.date,
                amount=initial_paid,
                reference="",
                status=PAYMENT_LEDGER_POSTED,
            )
            _recompute_payment_status(invoice)
        return invoice

    def update(self, instance, validated_data):
        if instance.status == INVOICE_STATUS_POSTED:
            raise serializers.ValidationError(
                "Posted invoices cannot be edited."
            )
        initial_paid = validated_data.pop("paid_amount", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if _reference_is_empty(instance.reference):
            instance.reference = _generate_invoice_reference(
                instance.account_id,
                instance.date,
                instance.invoice_type,
            )
        if initial_paid is not None and instance.status == INVOICE_STATUS_DRAFT:
            instance.paid_amount = initial_paid
        instance.save()
        if instance.status == INVOICE_STATUS_POSTED:
            amount_to_pay = None
            if initial_paid is not None and initial_paid > 0:
                amount_to_pay = initial_paid
            elif (instance.paid_amount or Decimal("0.00")) > 0:
                amount_to_pay = instance.paid_amount
            if amount_to_pay is not None and amount_to_pay > 0:
                if amount_to_pay > instance.amount:
                    raise serializers.ValidationError(
                        {"paid_amount": "Paid amount cannot exceed total amount."}
                    )
                InvoicePayment.objects.create(
                    invoice=instance,
                    date=instance.date,
                    amount=amount_to_pay,
                    reference="",
                    status=PAYMENT_LEDGER_POSTED,
                )
                _recompute_payment_status(instance)
        return instance


class InvoiceDocumentListSerializer(serializers.ModelSerializer):
    """List document for an invoice (read-only)."""

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
