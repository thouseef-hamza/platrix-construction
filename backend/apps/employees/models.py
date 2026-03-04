from decimal import Decimal

from django.db import models

from apps.core.models import BaseModel

from .constants import (
    EMPLOYMENT_STATUS_CHOICES,
    EMPLOYMENT_TYPE_CHOICES,
    GENDER_CHOICES,
    MARITAL_STATUS_CHOICES,
    SPONSORSHIP_CHOICES,
)


class Employee(BaseModel):
    """Employee scoped by tenant account. All sections: identity, identification, employment, salary/WPS, medical, documents."""

    account = models.ForeignKey(
        "accounts.Account",
        on_delete=models.CASCADE,
        related_name="employees",
        db_index=True,
    )

    # Basic Identity
    full_name = models.CharField(max_length=255, db_index=True)
    nationality = models.CharField(max_length=128, blank=True)
    gender = models.CharField(max_length=16, choices=GENDER_CHOICES, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    marital_status = models.CharField(
        max_length=32, choices=MARITAL_STATUS_CHOICES, blank=True
    )

    # Identification
    qid_number = models.CharField(max_length=64, blank=True, db_index=True)
    qid_expiry_date = models.DateField(null=True, blank=True)
    passport_number = models.CharField(max_length=64, blank=True)
    passport_expiry_date = models.DateField(null=True, blank=True)
    visa_number = models.CharField(max_length=64, blank=True)
    visa_expiry_date = models.DateField(null=True, blank=True)
    sponsorship_type = models.IntegerField(
        choices=SPONSORSHIP_CHOICES, null=True, blank=True, db_index=True
    )

    # Employment
    employee_id = models.CharField(
        max_length=64, blank=True, db_index=True, help_text="Internal employee ID"
    )
    joining_date = models.DateField(null=True, blank=True)
    employment_type = models.IntegerField(
        choices=EMPLOYMENT_TYPE_CHOICES, null=True, blank=True, db_index=True
    )
    job_title = models.CharField(max_length=128, blank=True)
    department = models.CharField(max_length=128, blank=True)
    employment_status = models.IntegerField(
        choices=EMPLOYMENT_STATUS_CHOICES, null=True, blank=True, db_index=True
    )

    # Salary structure
    basic_salary = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, default=None
    )
    housing_allowance = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, default=None
    )
    transportation_allowance = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, default=None
    )
    other_allowances = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True, default=None
    )

    # Bank & WPS
    bank_name = models.CharField(max_length=128, blank=True)
    iban = models.CharField(max_length=64, blank=True)

    # Medical & Insurance
    health_card_number = models.CharField(max_length=64, blank=True)
    health_insurance_policy = models.CharField(max_length=128, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=128, blank=True)
    emergency_contact_phone = models.CharField(max_length=32, blank=True)

    class Meta:
        db_table = "employees_employee"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["account", "is_deleted"]),
            models.Index(fields=["account", "employment_status"]),
            models.Index(fields=["account", "department"]),
        ]
        verbose_name_plural = "employees"

    def __str__(self):
        return self.full_name


class EmployeeSalaryEntry(BaseModel):
    """Salary entry for an employee (advance, remaining, regular, etc.) with description."""

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="salary_entries",
        db_index=True,
    )
    date = models.DateField(db_index=True)
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        help_text="e.g. Advance, Remaining amount, Bonus, Adjustment",
    )

    class Meta:
        db_table = "employees_employeesalaryentry"
        ordering = ["-date", "-id"]
        indexes = [
            models.Index(fields=["employee", "is_deleted"]),
        ]
        verbose_name_plural = "employee salary entries"

    def __str__(self):
        return f"{self.employee.full_name} – {self.amount} ({self.description or 'Salary'})"


class EmployeeTransaction(BaseModel):
    """Financial transaction between company and employee (payments, advances, reimbursements, etc.)."""

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="transactions",
        db_index=True,
    )
    date = models.DateField(db_index=True)
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )
    description = models.CharField(max_length=255, blank=True)
    # Positive = company pays employee; negative = employee owes / deduction
    # Or use a type: payment, advance, reimbursement, deduction
    transaction_type = models.CharField(
        max_length=32,
        blank=True,
        help_text="e.g. salary_payment, advance, reimbursement, deduction",
    )
    reference = models.CharField(max_length=128, blank=True)

    class Meta:
        db_table = "employees_employeetransaction"
        ordering = ["-date", "-id"]
        indexes = [
            models.Index(fields=["employee", "is_deleted"]),
            models.Index(fields=["employee", "date"]),
        ]
        verbose_name_plural = "employee transactions"

    def __str__(self):
        return f"{self.employee.full_name} – {self.amount} on {self.date}"
