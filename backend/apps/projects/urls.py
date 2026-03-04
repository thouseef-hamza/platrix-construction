from django.urls import path

from .views import (
    ProjectDocumentDestroyAPIView,
    ProjectDocumentDownloadAPIView,
    ProjectDocumentListCreateAPIView,
    ProjectListCreateAPIView,
    ProjectUpdateAPIView,
)

urlpatterns = [
    path("", ProjectListCreateAPIView.as_view()),
    path("<int:pk>/", ProjectUpdateAPIView.as_view()),
    path("<int:pk>/documents/", ProjectDocumentListCreateAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/download/", ProjectDocumentDownloadAPIView.as_view()),
    path("<int:pk>/documents/<int:doc_pk>/", ProjectDocumentDestroyAPIView.as_view()),
]
