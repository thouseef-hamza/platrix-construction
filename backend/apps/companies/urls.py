from django.urls import path

from .views import CompanyDetailView, CompanyListCreateView

urlpatterns = [
    path("", CompanyListCreateView.as_view()),
    path("<int:pk>/", CompanyDetailView.as_view()),
]
