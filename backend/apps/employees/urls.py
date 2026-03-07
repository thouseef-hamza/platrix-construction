from django.urls import path

from .views import (
    EmployeeDetailAPIView,
    EmployeeDocumentDestroyAPIView,
    EmployeeDocumentDownloadAPIView,
    EmployeeDocumentListCreateAPIView,
    EmployeeExpenseListAPIView,
    EmployeeListCreateAPIView,
    EmployeeSalaryDetailAPIView,
    EmployeeSalaryListCreateAPIView,
    EmployeeTransactionListCreateAPIView,
)

urlpatterns = [
    path("", EmployeeListCreateAPIView.as_view()),
    path("<int:pk>/", EmployeeDetailAPIView.as_view()),
    path("<int:pk>/salaries/", EmployeeSalaryListCreateAPIView.as_view()),
    path("<int:pk>/salaries/<int:entry_pk>/", EmployeeSalaryDetailAPIView.as_view()),
    path("<int:pk>/expenses/", EmployeeExpenseListAPIView.as_view()),
    path("<int:pk>/transactions/", EmployeeTransactionListCreateAPIView.as_view()),
    path("<int:pk>/documents/", EmployeeDocumentListCreateAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/download/", EmployeeDocumentDownloadAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/", EmployeeDocumentDestroyAPIView.as_view()),
]
