from django.urls import path

from .views import (
    PurchaseDetailAPIView,
    PurchaseDocumentDestroyAPIView,
    PurchaseDocumentDownloadAPIView,
    PurchaseDocumentListCreateAPIView,
    PurchaseListCreateAPIView,
    PurchasePaymentDetailAPIView,
    PurchasePaymentListCreateAPIView,
)

urlpatterns = [
    path("", PurchaseListCreateAPIView.as_view()),
    path("<int:pk>/", PurchaseDetailAPIView.as_view()),
    path("<int:pk>/payments/", PurchasePaymentListCreateAPIView.as_view()),
    path("<int:pk>/payments/<int:payment_pk>/", PurchasePaymentDetailAPIView.as_view()),
    path("<int:pk>/documents/", PurchaseDocumentListCreateAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/download/", PurchaseDocumentDownloadAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/", PurchaseDocumentDestroyAPIView.as_view()),
]
