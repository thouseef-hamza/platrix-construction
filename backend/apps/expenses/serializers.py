from decimal import Decimal

from rest_framework import serializers

from .constants import (
    PAYMENT_STATUS_COMPLETED,
    PAYMENT_STATUS_NOT_COMPLETED,
    PAYMENT_STATUS_PARTIAL,
    EXPENSE_STATUS_DRAFT,
    EXPENSE_STATUS_POSTED,
)
from .models import Expense, ExpensePayment


class ExpensePaymentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensePayment
        fields = ("id", "date", "amount", "reference", "created_at")


class ExpensePaymentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensePayment
        fields = ("date", "amount", "reference")

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class ExpenseListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    labor_type_display = serializers.CharField(
        source="get_labor_type_display", read_only=True, allow_null=True
    )
    payee_id = serializers.IntegerField(
        source="payee.id", read_only=True, allow_null=True
    )
    payee_name = serializers.CharField(
        source="payee.name", read_only=True, allow_null=True
    )
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Expense
        fields = (
            "id",
            "account",
            "category",
            "category_display",
            "description",
            "payee_id",
            "payee_name",
            "project_id",
            "project_name",
            "reference",
            "date",
            "status",
            "status_display",
            "labor_type",
            "labor_type_display",
            "quantity",
            "rate",
            "employee_id",
            "employee_name",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "amount",
            "paid_amount",
            "paid_at",
            "created_at",
            "updated_at",
        )


class ExpenseDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    labor_type_display = serializers.CharField(
        source="get_labor_type_display", read_only=True, allow_null=True
    )
    payee_id = serializers.IntegerField(
        source="payee.id", read_only=True, allow_null=True
    )
    payee_name = serializers.CharField(
        source="payee.name", read_only=True, allow_null=True
    )
    project_id = serializers.IntegerField(
        source="project.id", read_only=True, allow_null=True
    )
    project_name = serializers.CharField(
        source="project.name", read_only=True, allow_null=True
    )
    payments = ExpensePaymentReadSerializer(many=True, read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "account",
            "category",
            "category_display",
            "description",
            "payee_id",
            "payee_name",
            "project_id",
            "project_name",
            "reference",
            "date",
            "status",
            "status_display",
            "labor_type",
            "labor_type_display",
            "quantity",
            "rate",
            "employee_id",
            "employee_name",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "amount",
            "paid_amount",
            "paid_at",
            "payments",
            "created_at",
            "updated_at",
        )


class ExpenseWriteSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Expense
        fields = (
            "id",
            "account",
            "payee",
            "project",
            "reference",
            "date",
            "status",
            "category",
            "description",
            "amount",
            "labor_type",
            "quantity",
            "rate",
            "employee_id",
            "employee_name",
            "payment_method",
            "paid_amount",
            "payment_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "payment_status", "created_at", "updated_at")

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        account_id = attrs.get("account")
        if account_id is not None:
            account_id = getattr(account_id, "pk", account_id)
        payee = attrs.get("payee")
        project = attrs.get("project")
        if payee and getattr(payee, "account_id", None) != account_id:
            raise serializers.ValidationError(
                {"payee": "Payee must belong to the same account."}
            )
        if project and getattr(project, "account_id", None) != account_id:
            raise serializers.ValidationError(
                {"project": "Project must belong to the same account."}
            )
        return attrs

    def create(self, validated_data):
        initial_paid = validated_data.pop("paid_amount", None)
        reference = validated_data.get("reference") or ""
        if not reference and validated_data.get("description"):
            reference = (validated_data["description"][:120] or "Expense").strip()
        validated_data["reference"] = reference
        expense = Expense.objects.create(
            **validated_data,
            paid_amount=Decimal("0.00"),
        )
        if initial_paid is not None and initial_paid > 0:
            ExpensePayment.objects.create(
                expense=expense,
                date=expense.date,
                amount=initial_paid,
                reference="",
            )
            _recompute_payment_status(expense)
        return expense

    def update(self, instance, validated_data):
        if instance.status == EXPENSE_STATUS_POSTED:
            raise serializers.ValidationError(
                "Posted expenses cannot be edited."
            )
        validated_data.pop("paid_amount", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


def _recompute_payment_status(expense):
    from django.db.models import Sum

    total_paid = (
        ExpensePayment.objects.filter(
            expense=expense, is_deleted=False
        ).aggregate(s=Sum("amount"))["s"]
        or Decimal("0.00")
    )
    expense.paid_amount = total_paid
    if total_paid >= expense.amount:
        expense.payment_status = PAYMENT_STATUS_COMPLETED
    elif total_paid > 0:
        expense.payment_status = PAYMENT_STATUS_PARTIAL
    else:
        expense.payment_status = PAYMENT_STATUS_NOT_COMPLETED
    expense.save(update_fields=["paid_amount", "payment_status"])
