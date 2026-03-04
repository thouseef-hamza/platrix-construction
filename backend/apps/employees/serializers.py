from rest_framework import serializers

from .models import Employee, EmployeeSalaryEntry, EmployeeTransaction


class EmployeeSalaryEntryReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSalaryEntry
        fields = ("id", "date", "amount", "description", "created_at")


class EmployeeSalaryEntryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeSalaryEntry
        fields = ("date", "amount", "description")

    def validate_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Amount cannot be negative.")
        return value


class EmployeeTransactionReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTransaction
        fields = (
            "id",
            "date",
            "amount",
            "description",
            "transaction_type",
            "reference",
            "created_at",
        )


class EmployeeTransactionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeTransaction
        fields = ("date", "amount", "description", "transaction_type", "reference")


class EmployeeListSerializer(serializers.ModelSerializer):
    """Summary for list view."""

    class Meta:
        model = Employee
        fields = (
            "id",
            "full_name",
            "nationality",
            "gender",
            "date_of_birth",
            "marital_status",
            "qid_number",
            "qid_expiry_date",
            "passport_number",
            "passport_expiry_date",
            "visa_number",
            "visa_expiry_date",
            "sponsorship_type",
            "employee_id",
            "joining_date",
            "employment_type",
            "job_title",
            "department",
            "employment_status",
            "basic_salary",
            "housing_allowance",
            "transportation_allowance",
            "other_allowances",
            "bank_name",
            "iban",
            "health_card_number",
            "health_insurance_policy",
            "insurance_expiry",
            "emergency_contact_name",
            "emergency_contact_phone",
            "created_at",
            "updated_at",
        )


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Full detail with nested salary entries and transactions."""

    salary_entries = EmployeeSalaryEntryReadSerializer(many=True, read_only=True)
    transactions = EmployeeTransactionReadSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = (
            "id",
            "account",
            "full_name",
            "nationality",
            "gender",
            "date_of_birth",
            "marital_status",
            "qid_number",
            "qid_expiry_date",
            "passport_number",
            "passport_expiry_date",
            "visa_number",
            "visa_expiry_date",
            "sponsorship_type",
            "employee_id",
            "joining_date",
            "employment_type",
            "job_title",
            "department",
            "employment_status",
            "basic_salary",
            "housing_allowance",
            "transportation_allowance",
            "other_allowances",
            "bank_name",
            "iban",
            "health_card_number",
            "health_insurance_policy",
            "insurance_expiry",
            "emergency_contact_name",
            "emergency_contact_phone",
            "salary_entries",
            "transactions",
            "created_at",
            "updated_at",
        )


class EmployeeWriteSerializer(serializers.ModelSerializer):
    """Create and update employee."""

    class Meta:
        model = Employee
        fields = (
            "full_name",
            "nationality",
            "gender",
            "date_of_birth",
            "marital_status",
            "qid_number",
            "qid_expiry_date",
            "passport_number",
            "passport_expiry_date",
            "visa_number",
            "visa_expiry_date",
            "sponsorship_type",
            "employee_id",
            "joining_date",
            "employment_type",
            "job_title",
            "department",
            "employment_status",
            "basic_salary",
            "housing_allowance",
            "transportation_allowance",
            "other_allowances",
            "bank_name",
            "iban",
            "health_card_number",
            "health_insurance_policy",
            "insurance_expiry",
            "emergency_contact_name",
            "emergency_contact_phone",
        )

    def validate_full_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Full name is required.")
        return value.strip()
