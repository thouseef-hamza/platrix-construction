from django.urls import path

from .views import (
    EmployeeDetailAPIView,
    EmployeeListCreateAPIView,
    EmployeeSalaryListCreateAPIView,
    EmployeeTransactionListCreateAPIView,
)

urlpatterns = [
    path("", EmployeeListCreateAPIView.as_view()),
    path("<int:pk>/", EmployeeDetailAPIView.as_view()),
    path("<int:pk>/salaries/", EmployeeSalaryListCreateAPIView.as_view()),
    path("<int:pk>/transactions/", EmployeeTransactionListCreateAPIView.as_view()),
]
