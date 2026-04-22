from django.apps import AppConfig


class TareasConfig(AppConfig):
    name = 'tareas'

    def ready(self):
        import tareas.signals  # noqa: F401
        import tareas.equipo_signals  # noqa: F401