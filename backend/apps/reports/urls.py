from django.urls import path

from .views import (
    BalanceSheetReportAPIView,
    OverallPnLReportAPIView,
    ProjectPnLReportAPIView,
)

urlpatterns = [
    path("project-pnl/", ProjectPnLReportAPIView.as_view()),
    path("overall-pnl/", OverallPnLReportAPIView.as_view()),
    path("balance-sheet/", BalanceSheetReportAPIView.as_view()),
]
