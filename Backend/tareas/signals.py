from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Proyecto, Estado


@receiver(post_save, sender=Proyecto)
def crear_estados_default(sender, instance, created, **kwargs):
    """Crear estados por defecto cuando se crea un nuevo proyecto."""
    if created:
        # Verificar si el proyecto ya tiene estados
        if instance.estados.exists():
            return
        
        # Crear 3 estados por defecto
        estados_default = [
            {"nombre": "Pendiente", "color": "#6b7280", "orden": 0},
            {"nombre": "En Proceso", "color": "#3b82f6", "orden": 1},
            {"nombre": "Completada", "color": "#10b981", "orden": 2, "es_final": True},
        ]
        
        for estado_data in estados_default:
            Estado.objects.create(
                proyecto=instance,
                usuario=instance.creador,
                nombre=estado_data["nombre"],
                color=estado_data["color"],
                orden=estado_data["orden"],
                es_final=estado_data.get("es_final", False)
            )