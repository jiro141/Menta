from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.conf import settings


# ============================================
# MODELOS DE EQUIPOS Y PROYECTOS
# ============================================

class Equipo(models.Model):
    """Equipo de trabajo que agrupa múltiples proyectos."""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, default="")
    color = models.CharField(max_length=20, default="#6366f1")
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='equipos_creados'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.nombre


class Proyecto(models.Model):
    """Proyecto que pertenece a un equipo y agrupa tareas, estados y miembros."""
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, default="")
    color = models.CharField(max_length=20, default="#6366f1")
    icono = models.CharField(max_length=50, default="folder")  # Icono de lucide-react
    equipo = models.ForeignKey(
        Equipo,
        on_delete=models.CASCADE,
        related_name='proyectos'
    )
    creador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proyectos_creados'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return self.nombre


class Miembro(models.Model):
    """Relación usuario-equipo con rol ADMIN o DEV.
    
    Ser miembro de un equipo da acceso a todos los proyectos de ese equipo.
    """
    
    class Rol(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        DEV = 'DEV', 'Desarrollador'
    
    equipo = models.ForeignKey(
        Equipo,
        on_delete=models.CASCADE,
        related_name='miembros'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='miembros_equipo'
    )
    rol = models.CharField(max_length=10, choices=Rol.choices, default=Rol.DEV)
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['equipo', 'usuario']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.equipo.nombre} ({self.rol})"


class Mensaje(models.Model):
    """Mensaje de chat en un proyecto."""
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.CASCADE,
        related_name='mensajes'
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mensajes_enviados'
    )
    contenido = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.autor.username}: {self.contenido[:30]}..."


def validate_estado_nombre(value):
    """Valida que el nombre del estado tenga al menos 5 caracteres y no inicie con número o signo."""
    import re
    if len(value) < 5:
        raise ValidationError("El nombre debe tener al menos 5 caracteres")
    if re.match(r'^[0-9\W]', value):
        raise ValidationError("El nombre no puede iniciar con un número o signo")


def validate_etiqueta_nombre(value):
    """Valida que el nombre de la etiqueta tenga al menos 5 caracteres."""
    if len(value) < 5:
        raise ValidationError("El nombre debe tener al menos 5 caracteres")


def validate_tarea_titulo(value):
    """Valida que el título tenga entre 5 y 20 caracteres."""
    if len(value) < 5:
        raise ValidationError("El título debe tener al menos 5 caracteres")
    if len(value) > 20:
        raise ValidationError("El título debe tener máximo 20 caracteres")


def validate_tarea_descripcion(value):
    """Valida que la descripción tenga entre 10 y 500 caracteres."""
    if value and len(value) < 10:
        raise ValidationError("La descripción debe tener al menos 10 caracteres")
    if value and len(value) > 500:
        raise ValidationError("La descripción debe tener máximo 500 caracteres")


# 1. Tabla de Estados (ej: Pendiente, En Proceso, Terminada)
class Estado(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='estados'
    )
    # FK a proyecto (nullable para backward compatibility)
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estados'
    )
    # FK a equipo (nullable para migración)
    equipo = models.ForeignKey(
        Equipo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estados'
    )
    nombre = models.CharField(
        max_length=50, 
        validators=[validate_estado_nombre]
    )
    color = models.CharField(max_length=20, default="#6b7280")
    orden = models.PositiveIntegerField(default=0)
    es_final = models.BooleanField(
        default=False,
        help_text="Las tareas en este estado se consideran completadas"
    )

    class Meta:
        ordering = ['orden', 'id']

    def __str__(self):
        return self.nombre

# 2. Tabla de Etiquetas (ej: Trabajo, Hogar, Urgente)
class Etiqueta(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='etiquetas'
    )
    nombre = models.CharField(
        max_length=50, 
        validators=[validate_etiqueta_nombre]
    )
    color = models.CharField(max_length=20, default="#3498db") # Opcional: para visualización

    class Meta:
        # Nombre único por usuario
        unique_together = ['usuario', 'nombre']

    def __str__(self):
        return self.nombre

# 3. Tabla Principal de Tareas
class Tarea(models.Model):
    # Django crea el 'id' (Primary Key) automáticamente, no hace falta escribirlo.
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tareas'
    )
    
    # FK a proyecto (nullable para backward compatibility)
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas'
    )
    
    titulo = models.CharField(
        max_length=200, 
        verbose_name="Título de la tarea",
        validators=[validate_tarea_titulo]
    )
    descripcion = models.TextField(
        null=True, 
        blank=True, 
        verbose_name="Descripción",
        validators=[validate_tarea_descripcion]
    )
    
    # Fechas
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_inicio = models.DateField(null=True, blank=True, verbose_name="Fecha de inicio")
    fecha_fin = models.DateField(null=True, blank=True, verbose_name="Fecha de fin")
    
    # Archivo
    archivada = models.BooleanField(default=False, verbose_name="Archivada")
    
    # Relaciones (Foreign Keys)
    # Una tarea tiene un estado. Si el estado se borra, la tarea se queda sin estado (null).
    estado = models.ForeignKey(
        Estado, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='tareas'
    )
    
    # Asignado a miembro del proyecto
    asignado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tareas_asignadas'
    )
    
    # Pending approval flag
    pendiente_aprobacion = models.BooleanField(default=False, verbose_name="Pendiente de aprobación")
    aprobada = models.BooleanField(default=False, verbose_name="Aprobada")
    
    # Una tarea puede tener múltiples etiquetas
    etiquetas = models.ManyToManyField(
        Etiqueta, 
        related_name='tareas',
        blank=True
    )

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name_plural = "Tareas"


# 4. Tabla de Subtareas
class Subtarea(models.Model):
    """Subtareas vinculadas a una tarea principal."""
    tarea = models.ForeignKey(
        Tarea, 
        on_delete=models.CASCADE, 
        related_name='subtareas'
    )
    titulo = models.CharField(max_length=100)
    completada = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden', 'id']

    def __str__(self):
        return f"{self.titulo} ({'✓' if self.completada else '○'})"