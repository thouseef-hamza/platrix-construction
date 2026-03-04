from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.users.urls")),
    path("accounting/", include("apps.accounting.urls")),
    path("companies/", include("apps.companies.urls")),
    path("inventory/", include("apps.inventory.urls")),
    path("projects/", include("apps.projects.urls")),
    path("purchases/", include("apps.purchase.urls")),
    path("expenses/", include("apps.expenses.urls")),
    path("employees/", include("apps.employees.urls")),
]
