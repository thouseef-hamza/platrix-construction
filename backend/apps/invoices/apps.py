from django.apps import AppConfig


class InvoicesConfig(AppConfig):
    name = "apps.invoices"

    def ready(self):
        from . import signals  # noqa: F401
