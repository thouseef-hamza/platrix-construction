from decimal import Decimal

from rest_framework import serializers

from .models import ChartOfAccount, LedgerEntry, LedgerLine


class ChartOfAccountListSerializer(serializers.ModelSerializer):
    """List/read chart of account. balance = sum(debit - credit) from posted ledger lines."""

    account_type_display = serializers.CharField(
        source="get_account_type_display", read_only=True
    )
    balance = serializers.SerializerMethodField()

    class Meta:
        model = ChartOfAccount
        fields = (
            "id",
            "account",
            "code",
            "name",
            "account_type",
            "account_type_display",
            "parent",
            "description",
            "is_active",
            "is_system",
            "balance",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_balance(self, obj):
        # From annotated queryset (list/detail) or 0 for new instances (e.g. create response)
        bal = getattr(obj, "balance", None)
        if bal is not None:
            return bal
        return Decimal("0.00")


class ChartOfAccountWriteSerializer(serializers.ModelSerializer):
    """Create/update chart of account."""

    class Meta:
        model = ChartOfAccount
        fields = (
            "id",
            "account",
            "code",
            "name",
            "account_type",
            "parent",
            "description",
            "is_active",
            "is_system",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


# ----- Journal entries (ledger) -----


class LedgerLineSerializer(serializers.ModelSerializer):
    """Single line in a journal entry."""

    chart_of_account_code = serializers.CharField(
        source="chart_of_account.code", read_only=True
    )
    chart_of_account_name = serializers.CharField(
        source="chart_of_account.name", read_only=True
    )

    class Meta:
        model = LedgerLine
        fields = (
            "id",
            "entry",
            "chart_of_account",
            "chart_of_account_code",
            "chart_of_account_name",
            "line_number",
            "description",
            "debit",
            "credit",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class LedgerLineWriteSerializer(serializers.ModelSerializer):
    """Create/update a ledger line (used nested in entry)."""

    class Meta:
        model = LedgerLine
        fields = (
            "id",
            "chart_of_account",
            "line_number",
            "description",
            "debit",
            "credit",
        )
        read_only_fields = ("id",)


class LedgerEntrySerializer(serializers.ModelSerializer):
    """Journal entry with nested lines (read)."""

    lines = LedgerLineSerializer(many=True, read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LedgerEntry
        fields = (
            "id",
            "account",
            "entry_number",
            "entry_date",
            "posting_date",
            "description",
            "reference",
            "source",
            "source_display",
            "status",
            "status_display",
            "posted_at",
            "posted_by",
            "created_by",
            "lines",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "entry_number",
            "posted_at",
            "posted_by",
            "created_at",
            "updated_at",
        )


class LedgerEntryWriteSerializer(serializers.ModelSerializer):
    """Create/update journal entry with nested lines. Validates debits = credits."""

    lines = LedgerLineWriteSerializer(many=True, required=False)

    class Meta:
        model = LedgerEntry
        fields = (
            "id",
            "account",
            "entry_number",
            "entry_date",
            "posting_date",
            "description",
            "reference",
            "source",
            "status",
            "lines",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_lines(self, value):
        if not value:
            return value
        total_debit = sum(Decimal(str(line.get("debit") or 0)) for line in value)
        total_credit = sum(Decimal(str(line.get("credit") or 0)) for line in value)
        if total_debit != total_credit:
            raise serializers.ValidationError(
                "Total debits must equal total credits."
            )
        return value

    def create(self, validated_data):
        lines_data = validated_data.pop("lines", [])
        entry = LedgerEntry.objects.create(**validated_data)
        for i, line_data in enumerate(lines_data):
            LedgerLine.objects.create(
                entry=entry,
                line_number=line_data.get("line_number", i + 1),
                chart_of_account=line_data["chart_of_account"],
                description=line_data.get("description", ""),
                debit=line_data.get("debit", Decimal("0.00")),
                credit=line_data.get("credit", Decimal("0.00")),
            )
        return entry

    def update(self, instance, validated_data):
        lines_data = validated_data.pop("lines", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for i, line_data in enumerate(lines_data):
                LedgerLine.objects.create(
                    entry=instance,
                    line_number=line_data.get("line_number", i + 1),
                    chart_of_account=line_data["chart_of_account"],
                    description=line_data.get("description", ""),
                    debit=line_data.get("debit", Decimal("0.00")),
                    credit=line_data.get("credit", Decimal("0.00")),
                )
        return instance
