from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from apps.accounting.constants import ACCOUNT_TYPE_EXPENSE
from apps.core.models import Document

from .constants import (
    EXPENSE_CATEGORY_GENERAL,
    GENERAL_EXPENSE_EXCLUDED_COA_CODES,
    PAYMENT_LEDGER_DRAFT,
    PAYMENT_LEDGER_POSTED,
    PAYMENT_STATUS_COMPLETED,
    PAYMENT_STATUS_NOT_COMPLETED,
    PAYMENT_STATUS_PARTIAL,
    EXPENSE_STATUS_DRAFT,
    EXPENSE_STATUS_POSTED,
)
from .models import Expense, ExpensePayment


class ExpensePaymentReadSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = ExpensePayment
        fields = ("id", "date", "amount", "reference", "status", "status_display", "created_at")


class ExpensePaymentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpensePayment
        fields = ("date", "amount", "reference", "status")
        extra_kwargs = {"status": {"default": PAYMENT_LEDGER_DRAFT}}

    def validate_amount(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs):
        expense = self.context.get("expense") or (
            self.instance.expense if self.instance else None
        )
        if not expense:
            return attrs

        amount = attrs.get("amount")
        if amount is None and self.instance:
            amount = self.instance.amount
        if amount is None:
            return attrs

        amount = Decimal(str(amount))
        other_payments = expense.payments.filter(is_deleted=False)
        if self.instance:
            other_payments = other_payments.exclude(pk=self.instance.pk)
        total_other = (
            other_payments.aggregate(s=Sum("amount"))["s"] or Decimal("0.00")
        )
        expense_amount = getattr(expense, "amount", None) or Decimal("0.00")
        if isinstance(expense_amount, (int, float)):
            expense_amount = Decimal(str(expense_amount))

        if total_other + amount > expense_amount:
            raise serializers.ValidationError(
                {
                    "amount": "Payment amount cannot exceed the remaining balance due. "
                    "Total payments must not exceed the expense amount."
                }
            )
        return attrs


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
    expense_account_id = serializers.IntegerField(
        source="expense_account.id", read_only=True, allow_null=True
    )
    expense_account_code = serializers.CharField(
        source="expense_account.code", read_only=True, allow_null=True
    )
    expense_account_name = serializers.CharField(
        source="expense_account.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Expense
        fields = (
            "id",
            "account",
            "category",
            "category_display",
            "expense_account_id",
            "expense_account_code",
            "expense_account_name",
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
    expense_account_id = serializers.IntegerField(
        source="expense_account.id", read_only=True, allow_null=True
    )
    expense_account_code = serializers.CharField(
        source="expense_account.code", read_only=True, allow_null=True
    )
    expense_account_name = serializers.CharField(
        source="expense_account.name", read_only=True, allow_null=True
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
            "expense_account_id",
            "expense_account_code",
            "expense_account_name",
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
            "expense_account",
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
        elif self.instance is not None:
            account_id = getattr(self.instance, "account_id", None)
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
        category = attrs.get("category")
        expense_account = attrs.get("expense_account")
        if category == EXPENSE_CATEGORY_GENERAL and expense_account is not None:
            if expense_account.account_type != ACCOUNT_TYPE_EXPENSE:
                raise serializers.ValidationError(
                    {"expense_account": "Must be an expense-type account."}
                )
            if expense_account.code in GENERAL_EXPENSE_EXCLUDED_COA_CODES:
                raise serializers.ValidationError(
                    {"expense_account": "This expense account is not allowed for general expenses."}
                )
            if getattr(expense_account, "account_id", None) != account_id:
                raise serializers.ValidationError(
                    {"expense_account": "Expense account must belong to the same account."}
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
        # When drafting, store paid_amount on the expense (no payment line). When posted, create payment.
        if expense.status == EXPENSE_STATUS_DRAFT:
            if initial_paid is not None:
                expense.paid_amount = initial_paid
                expense.save(update_fields=["paid_amount"])
        elif (
            initial_paid is not None
            and initial_paid > 0
            and expense.status == EXPENSE_STATUS_POSTED
        ):
            if initial_paid > expense.amount:
                raise serializers.ValidationError(
                    {"paid_amount": "Paid amount cannot exceed total amount."}
                )
            ExpensePayment.objects.create(
                expense=expense,
                date=expense.date,
                amount=initial_paid,
                reference="",
                status=PAYMENT_LEDGER_POSTED,
            )
            _recompute_payment_status(expense)
        return expense

    def update(self, instance, validated_data):
        if instance.status == EXPENSE_STATUS_POSTED:
            raise serializers.ValidationError(
                "Posted expenses cannot be edited."
            )
        initial_paid = validated_data.pop("paid_amount", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        # For drafts, persist paid_amount on the expense (no payment line).
        if initial_paid is not None and instance.status == EXPENSE_STATUS_DRAFT:
            instance.paid_amount = initial_paid
        instance.save()
        # When posting (draft -> posted), create payment from initial_paid or stored paid_amount.
        if instance.status == EXPENSE_STATUS_POSTED:
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
                ExpensePayment.objects.create(
                    expense=instance,
                    date=instance.date,
                    amount=amount_to_pay,
                    reference="",
                    status=PAYMENT_LEDGER_POSTED,
                )
                _recompute_payment_status(instance)
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


class ExpenseDocumentListSerializer(serializers.ModelSerializer):
    """List document for an expense (read-only)."""

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
