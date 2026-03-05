from django.urls import path

from .views import (
    InvoiceDetailAPIView,
    InvoiceDocumentDestroyAPIView,
    InvoiceDocumentDownloadAPIView,
    InvoiceDocumentListCreateAPIView,
    InvoiceListCreateAPIView,
    InvoicePaymentDetailAPIView,
    InvoicePaymentListCreateAPIView,
)

urlpatterns = [
    path("", InvoiceListCreateAPIView.as_view()),
    path("<int:pk>/", InvoiceDetailAPIView.as_view()),
    path("<int:pk>/payments/", InvoicePaymentListCreateAPIView.as_view()),
    path("<int:pk>/payments/<int:payment_pk>/", InvoicePaymentDetailAPIView.as_view()),
    path("<int:pk>/documents/", InvoiceDocumentListCreateAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/download/", InvoiceDocumentDownloadAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/", InvoiceDocumentDestroyAPIView.as_view()),
]
