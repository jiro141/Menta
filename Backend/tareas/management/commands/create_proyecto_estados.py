from django.core.management.base import BaseCommand
from tareas.models import Proyecto, Estado


class Command(BaseCommand):
    help = 'Crear estados por defecto para proyectos que no tienen estados'

    def handle(self, *args, **options):
        proyectos = Proyecto.objects.all()
        creados = 0
        
        for proyecto in proyectos:
            if proyecto.estados.exists():
                continue
            
            estados_default = [
                {"nombre": "Pendiente", "color": "#6b7280", "orden": 0},
                {"nombre": "En Proceso", "color": "#3b82f6", "orden": 1},
                {"nombre": "Completada", "color": "#10b981", "orden": 2, "es_final": True},
            ]
            
            for estado_data in estados_default:
                Estado.objects.create(
                    proyecto=proyecto,
                    usuario=proyecto.creador,
                    nombre=estado_data["nombre"],
                    color=estado_data["color"],
                    orden=estado_data["orden"],
                    es_final=estado_data.get("es_final", False)
                )
            
            creados += 1
            self.stdout.write(f'Proyecto "{proyecto.nombre}" - estados creados')
        
        self.stdout.write(self.style.SUCCESS(f'{creados} proyecto(s) actualizado(s)'))