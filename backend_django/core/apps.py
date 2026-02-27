from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
    verbose_name = "Construction Cost Manager"

    def ready(self):
        import core.signals  # noqa: F401
