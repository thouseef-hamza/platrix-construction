from django.urls import path

from .views_dashboard import DashboardAPIView

urlpatterns = [
    path("", DashboardAPIView.as_view()),
]
