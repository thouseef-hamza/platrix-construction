from django.urls import path

from .views import (
    ExpenseDetailAPIView,
    ExpenseListCreateAPIView,
    ExpensePaymentListCreateAPIView,
)

urlpatterns = [
    path("", ExpenseListCreateAPIView.as_view()),
    path("<int:pk>/", ExpenseDetailAPIView.as_view()),
    path("<int:pk>/payments/", ExpensePaymentListCreateAPIView.as_view()),
]
