from django.db import models

# 1. Tabla de Estados (ej: Pendiente, En Proceso, Terminada)
class Estado(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

# 2. Tabla de Etiquetas (ej: Trabajo, Hogar, Urgente)
class Etiqueta(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=20, default="#3498db") # Opcional: para visualización

    def __str__(self):
        return self.nombre

# 3. Tabla Principal de Tareas
class Tarea(models.Model):
    # Django crea el 'id' (Primary Key) automáticamente, no hace falta escribirlo.
    
    titulo = models.CharField(max_length=200, verbose_name="Título de la tarea")
    descripcion = models.TextField(null=True, blank=True, verbose_name="Descripción")
    
    # Fechas
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_culminacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de entrega")
    
    # Relaciones (Foreign Keys)
    # Una tarea tiene un estado. Si el estado se borra, la tarea se queda sin estado (null).
    estado = models.ForeignKey(
        Estado, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Una tarea puede tener una etiqueta (o muchas, si prefieres ManyToManyField)
    etiqueta = models.ForeignKey(
        Etiqueta, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name_plural = "Tareas"