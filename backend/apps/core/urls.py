from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("accounting/", include("apps.accounting.urls")),
]
