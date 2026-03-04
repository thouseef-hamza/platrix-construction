from django.urls import path

from .views import MaterialDetailView, MaterialListCreateView

urlpatterns = [
    path("materials/", MaterialListCreateView.as_view()),
    path("materials/<int:pk>/", MaterialDetailView.as_view()),
]
