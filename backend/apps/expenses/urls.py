from django.urls import path

from .views import (
    ExpenseDetailAPIView,
    ExpenseListCreateAPIView,
    ExpensePaymentDetailAPIView,
    ExpensePaymentListCreateAPIView,
)

urlpatterns = [
    path("", ExpenseListCreateAPIView.as_view()),
    path("<int:pk>/", ExpenseDetailAPIView.as_view()),
    path("<int:pk>/payments/", ExpensePaymentListCreateAPIView.as_view()),
    path("<int:pk>/payments/<int:payment_pk>/", ExpensePaymentDetailAPIView.as_view()),
]
