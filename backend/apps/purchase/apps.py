from django.apps import AppConfig


class PurchaseConfig(AppConfig):
    name = "apps.purchase"

    def ready(self):
        from . import signals  # noqa: F401
