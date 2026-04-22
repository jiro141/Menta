from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Estado, Etiqueta, Tarea, Subtarea, Equipo, Proyecto, Miembro, Mensaje


# ============================================
# SERIALIZERS DE EQUIPOS Y PROYECTOS
# ============================================

class EquipoSerializer(serializers.ModelSerializer):
    """Serializer para equipos."""
    miembro_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Equipo
        fields = ['id', 'nombre', 'descripcion', 'color', 'creador', 'fecha_creacion', 'miembro_count']
        extra_kwargs = {
            'creador': {'read_only': True},
            'fecha_creacion': {'read_only': True},
        }
    
    def get_miembro_count(self, obj):
        return obj.miembros.count()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "date_joined"]


class SubtareaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtarea
        fields = ["id", "titulo", "completada", "orden", "tarea"]


class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = ["id", "nombre", "color", "orden", "es_final"]


class EtiquetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etiqueta
        fields = ["id", "nombre", "color"]


class EtiquetasField(serializers.ListField):
    """Custom field that validates etiquetas belong to user."""
    
    def __init__(self, **kwargs):
        kwargs['child'] = serializers.IntegerField(min_value=1)
        super().__init__(**kwargs)
    
    def to_internal_value(self, data):
        print(f"[DEBUG] EtiquetasField.to_internal_value called with: {data}")
        
        # Get user from context
        request = self.parent.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("No autenticado")
        
        # Get user's etiquetas
        user_etiqueta_ids = set(Etiqueta.objects.filter(usuario=user).values_list('id', flat=True))
        print(f"[DEBUG] User's etiqueta IDs: {user_etiqueta_ids}")
        
        # Validate each ID
        if not isinstance(data, list):
            raise serializers.ValidationError("Debe ser una lista")
        
        validated = []
        for eid in data:
            try:
                eid_int = int(eid)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"ID inválido: {eid}")
            
            if eid_int not in user_etiqueta_ids:
                raise serializers.ValidationError([f'Invalid pk "{eid}" - object does not exist.'])
            
            validated.append(eid_int)
        
        print(f"[DEBUG] EtiquetasField validated: {validated}")
        return validated
    
    def to_representation(self, value):
        return [e.id for e in value.all()]


class TareaSerializer(serializers.ModelSerializer):
    estado = EstadoSerializer(read_only=True)
    etiquetas = EtiquetaSerializer(many=True, read_only=True)
    subtareas = SubtareaSerializer(many=True, read_only=True)

    # Use our custom field
    etiquetas_ids = EtiquetasField(
        source="etiquetas",
        write_only=True,
        required=False
    )

    estado_id = serializers.PrimaryKeyRelatedField(
        queryset=Estado.objects.none(),
        source="estado",
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Tarea
        fields = [
            "id", "titulo", "descripcion", "fecha_creacion",
            "fecha_inicio", "fecha_fin", "archivada",
            "estado", "estado_id", "etiquetas", "etiquetas_ids", "subtareas",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        
        print(f"[DEBUG] TareaSerializer __init__ - user: {user}")
        
        if user and user.is_authenticated:
            self.fields['estado_id'].queryset = Estado.objects.filter(usuario=user)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['archivada'] = instance.archivada
        return rep


# ============================================
# SERIALIZERS PARA PROYECTOS
# ============================================

class MiembroSerializer(serializers.ModelSerializer):
    """Serializer para miembros (pertenecen a Equipo)."""
    usuario = UserSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='usuario',
        write_only=True
    )
    
    class Meta:
        model = Miembro
        fields = ['id', 'equipo', 'usuario', 'usuario_id', 'rol', 'fecha_agregado']


class ProyectoSerializer(serializers.ModelSerializer):
    """Serializer para proyectos (pertenecen a Equipo)."""
    creador = UserSerializer(read_only=True)
    equipo = EquipoSerializer(read_only=True)
    equipo_id = serializers.PrimaryKeyRelatedField(
        queryset=Equipo.objects.all(),
        source='equipo',
        write_only=True
    )
    miembros = MiembroSerializer(many=True, read_only=True)
    
    class Meta:
        model = Proyecto
        fields = ['id', 'nombre', 'descripcion', 'color', 'icono', 'equipo', 'equipo_id', 'creador', 'fecha_creacion', 'miembros']
        extra_kwargs = {
            'creador': {'read_only': True},
            'fecha_creacion': {'read_only': True},
        }


class MensajeSerializer(serializers.ModelSerializer):
    autor = UserSerializer(read_only=True)
    
    class Meta:
        model = Mensaje
        fields = ['id', 'proyecto', 'autor', 'contenido', 'timestamp']


class TareaConProyectoSerializer(serializers.ModelSerializer):
    """Tarea con campos de proyecto.
    
    - proyecto: integer (read-only) en respuesta
    - estado_id: para crear/editar (write-only)
    - proyecto_id: para crear/editar (write-only)
    """
    estado = EstadoSerializer(read_only=True)
    etiquetas = EtiquetaSerializer(many=True, read_only=True)
    subtareas = SubtareaSerializer(many=True, read_only=True)
    asignado = UserSerializer(read_only=True)
    
    # Campo de respuesta: proyecto como integer
    proyecto = serializers.SerializerMethodField()
    
    def get_proyecto(self, obj):
        return obj.proyecto_id if obj.proyecto_id else None
    
    # Campos de escritura
    estado_id = serializers.PrimaryKeyRelatedField(
        queryset=Estado.objects.none(),
        source='estado',
        write_only=True,
        required=False,
        allow_null=True
    )
    # Acepta proyecto_id (integer) en POST/PATCH → lo mapea a proyecto FK
    proyecto_id = serializers.PrimaryKeyRelatedField(
        queryset=Proyecto.objects.none(),
        source='proyecto',
        write_only=True,
        required=False,
        allow_null=True
    )
    asignado_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='asignado',
        write_only=True,
        required=False,
        allow_null=True
    )
    etiquetas_ids = EtiquetasField(
        source='etiquetas',
        write_only=True,
        required=False
    )

    class Meta:
        model = Tarea
        fields = [
            'id', 'titulo', 'descripcion', 'fecha_creacion',
            'fecha_inicio', 'fecha_fin', 'archivada',
            'estado', 'estado_id', 'proyecto', 'proyecto_id',
            'etiquetas', 'etiquetas_ids', 'subtareas',
            'asignado', 'asignado_id', 'pendiente_aprobacion', 'aprobada',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        
        if user and user.is_authenticated:
            self.fields['estado_id'].queryset = Estado.objects.filter(usuario=user)
            miembro_equipo_ids = Miembro.objects.filter(usuario=user).values_list('equipo_id', flat=True)
            self.fields['proyecto_id'].queryset = Proyecto.objects.filter(equipo_id__in=miembro_equipo_ids)
