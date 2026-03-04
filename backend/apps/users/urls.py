from django.urls import path

from .views import LoginView, RefreshTokenView

app_name = "users"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshTokenView.as_view(), name="refresh"),
]
