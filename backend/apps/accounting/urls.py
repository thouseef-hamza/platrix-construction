from django.urls import path

from .views import (
    ChartOfAccountDetailView,
    ChartOfAccountListCreateView,
    JournalEntryDetailView,
    JournalEntryListCreateView,
    JournalEntryNextNumberView,
)

urlpatterns = [
    path("chart-of-accounts/", ChartOfAccountListCreateView.as_view()),
    path("chart-of-accounts/<uuid:pk>/", ChartOfAccountDetailView.as_view()),
    path("journal-entries/next-number/", JournalEntryNextNumberView.as_view()),
    path("journal-entries/", JournalEntryListCreateView.as_view()),
    path("journal-entries/<uuid:pk>/", JournalEntryDetailView.as_view()),
]
