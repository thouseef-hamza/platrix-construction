from django.contrib import admin
from .models import Employee, EmployeeSalaryEntry, EmployeeTransaction


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "employee_id", "department", "employment_status", "account")
    list_filter = ("employment_status", "employment_type", "account")
    search_fields = ("full_name", "employee_id", "department", "job_title")


@admin.register(EmployeeSalaryEntry)
class EmployeeSalaryEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "employee", "date", "amount", "description")
    list_filter = ("employee",)


@admin.register(EmployeeTransaction)
class EmployeeTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "employee", "date", "amount", "transaction_type", "description")
    list_filter = ("employee", "transaction_type")
