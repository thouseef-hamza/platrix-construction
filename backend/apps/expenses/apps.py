from django.apps import AppConfig


class ExpensesConfig(AppConfig):
    name = "apps.expenses"

    def ready(self):
        from . import signals  # noqa: F401
