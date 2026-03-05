from django.urls import path

from .views import (
    ExpenseAccountsForGeneralAPIView,
    ExpenseDetailAPIView,
    ExpenseDocumentDestroyAPIView,
    ExpenseDocumentDownloadAPIView,
    ExpenseDocumentListCreateAPIView,
    ExpenseListCreateAPIView,
    ExpensePaymentDetailAPIView,
    ExpensePaymentListCreateAPIView,
)

urlpatterns = [
    path("", ExpenseListCreateAPIView.as_view()),
    path("expense-accounts/", ExpenseAccountsForGeneralAPIView.as_view()),
    path("<int:pk>/", ExpenseDetailAPIView.as_view()),
    path("<int:pk>/payments/", ExpensePaymentListCreateAPIView.as_view()),
    path("<int:pk>/payments/<int:payment_pk>/", ExpensePaymentDetailAPIView.as_view()),
    path("<int:pk>/documents/", ExpenseDocumentListCreateAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/download/", ExpenseDocumentDownloadAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/", ExpenseDocumentDestroyAPIView.as_view()),
]
