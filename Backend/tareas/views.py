from django.db.models import Max, Q
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Estado, Etiqueta, Tarea, Subtarea, Equipo, Proyecto, Miembro, Mensaje
from .serializers import EstadoSerializer, EtiquetaSerializer, TareaSerializer, UserSerializer, SubtareaSerializer
from .serializers import EquipoSerializer, ProyectoSerializer, MiembroSerializer, MensajeSerializer, TareaConProyectoSerializer
from .permissions import EsAdminProyecto, EsMiembroProyecto, EsAdminProyectoOOwner


def get_user_from_request(request):
    """Get the authenticated user from the request."""
    if hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    # Try to get user from token in headers
    from rest_framework_simplejwt.authentication import JWTAuthentication
    auth = JWTAuthentication()
    result = auth.authenticate(request)
    if result:
        return result[0]
    return None


@api_view(['GET'])
def search_view(request):
    """
    Búsqueda elástica que busca por título de tarea o nombre de estado.
    Retorna tareas (incluye archivadas) y estados que coincidan con la búsqueda.
    Solo busca las tareas y estados del usuario autenticado.
    """
    if not request.user.is_authenticated:
        return Response({'tareas': [], 'estados': []})
    
    user = request.user
    query = request.query_params.get('q', '').strip()
    
    if not query:
        return Response({
            'tareas': [],
            'estados': []
        })
    
    # Buscar tareas por título o descripción (incluye archivadas para poder restaurarlas)
    tareas = Tarea.objects.filter(usuario=user).filter(
        Q(titulo__icontains=query) | Q(descripcion__icontains=query)
    ).select_related('estado').prefetch_related('etiquetas', 'subtareas')[:20]
    
    # Buscar estados por nombre
    estados = Estado.objects.filter(
        usuario=user,
        nombre__icontains=query
    )[:10]
    
    # Serializar resultados
    tarea_serializer = TareaSerializer(tareas, many=True, context={'request': request})
    estado_serializer = EstadoSerializer(estados, many=True)
    
    return Response({
        'tareas': tarea_serializer.data,
        'estados': estado_serializer.data
    })


@api_view(['GET'])
def search_users_view(request):
    """
    Busca usuarios por email para invitar a equipo.
    """
    if not request.user.is_authenticated:
        return Response({'usuarios': []})
    
    query = request.query_params.get('q', '').strip()
    
    if not query or len(query) < 3:
        return Response({'usuarios': []})
    
    # Buscar usuarios por email (excluye al usuario actual)
    usuarios = User.objects.filter(
        email__icontains=query
    ).exclude(
        id=request.user.id
    )[:10]
    
    usuario_serializer = UserSerializer(usuarios, many=True)
    
    return Response({
        'usuarios': usuario_serializer.data
    })


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    import json
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse(
            {"error": "Correo y contraseña son requeridos"},
            status=400
        )

    # Buscar usuario directamente por email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "Credenciales inválidas"},
            status=401
        )

    # Verificar contraseña manualmente
    if not user.check_password(password):
        return JsonResponse(
            {"error": "Credenciales inválidas"},
            status=401
        )
        
    # Verificar que el usuario está activo
    if not user.is_active:
        return JsonResponse(
            {"error": "La cuenta está desactivada"},
            status=401
        )

    # Generar tokens JWT
    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data
    })


@csrf_exempt
def register_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    import json
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse(
            {"error": "Correo y contraseña son requeridos"},
            status=400
        )

    # Verificar si el email ya existe
    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"error": "El correo ya está registrado"},
            status=400
        )

    # Generar username automáticamente del email
    username = email.split("@")[0][:150]

    # Si el username ya existe, agregar un suffix
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username[:145]}{counter}"
        counter += 1

    # Crear usuario
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Crear equipo personal del usuario automáticamente
    nombre_equipo = f"Mi Equipo ({email.split('@')[0]})"
    equipo = Equipo.objects.create(
        nombre=nombre_equipo,
        descripcion="Equipo personal",
        color="#6366f1",
        creador=user
    )
    # Agregar usuario como admin de su propio equipo
    Miembro.objects.create(
        equipo=equipo,
        usuario=user,
        rol=Miembro.Rol.ADMIN
    )

    # Generar tokens JWT
    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
        "equipo": EquipoSerializer(equipo).data
    }, status=201)


class EstadoViewSet(viewsets.ModelViewSet):
    serializer_class = EstadoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        equipo_id = self.request.query_params.get('equipo_id')
        if equipo_id:
            return Estado.objects.filter(
                equipo_id=equipo_id
            ).order_by("orden", "id")
        return Estado.objects.filter(
            usuario=self.request.user
        ).order_by("orden", "id")

    def perform_create(self, serializer):
        equipo_id = self.request.data.get('equipo_id')
        if equipo_id:
            try:
                equipo = Equipo.objects.get(id=equipo_id)
                serializer.save(usuario=self.request.user, equipo=equipo)
            except Equipo.DoesNotExist:
                serializer.save(usuario=self.request.user)
        else:
            serializer.save(usuario=self.request.user)

    def perform_update(self, serializer):
        """Actualizar estado solo si pertenece al usuario."""
        instance = self.get_object()
        if instance.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para modificar este estado")
        
        es_final = serializer.validated_data.get('es_final', False)
        
        if es_final:
            # Si se marca como final, quitar la marca de final de cualquier otro estado del usuario
            Estado.objects.filter(
                usuario=self.request.user, 
                es_final=True
            ).exclude(id=instance.id).update(es_final=False)
            # Asegurar que sea el último en orden
            max_result = Estado.objects.exclude(id=instance.id).aggregate(Max('orden'))
            max_orden = max_result['orden__max'] or 0
            serializer.save(orden=max_orden + 1)
        else:
            serializer.save()

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """Reordena estados basándose en una lista de IDs en el nuevo orden."""
        orden_ids = request.data.get("orden_ids", [])
        
        if not isinstance(orden_ids, list):
            return JsonResponse({"error": "orden_ids debe ser una lista"}, status=400)

        # Solo modificar estados del usuario
        for index, estado_id in enumerate(orden_ids):
            Estado.objects.filter(id=estado_id, usuario=request.user).update(orden=index)

        estados = Estado.objects.filter(usuario=request.user).order_by("orden").values("id", "nombre", "orden")
        return JsonResponse({"success": True, "estados": list(estados)})


class EtiquetaViewSet(viewsets.ModelViewSet):
    serializer_class = EtiquetaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Etiqueta.objects.filter(usuario=self.request.user).order_by("id")

    def perform_create(self, serializer):
        """Crear etiqueta asociada al usuario actual."""
        serializer.save(usuario=self.request.user)


class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["titulo", "descripcion"]
    ordering_fields = ["id", "fecha_creacion", "fecha_inicio", "fecha_fin", "titulo"]
    ordering = ["-fecha_creacion"]

    def get_serializer_context(self):
        """Add request to serializer context for proper queryset filtering."""
        context = super().get_serializer_context()
        context['request'] = self.request
        print(f"[DEBUG] get_serializer_context - request user: {self.request.user}")
        return context

    def get_queryset(self):
        queryset = Tarea.objects.filter(
            usuario=self.request.user
        ).select_related("estado").prefetch_related("etiquetas", "subtareas")
        
        # Solo aplicar filtro de archivado en list(), no en retrieve/update/delete
        if self.action == 'list':
            show_archived = self.request.query_params.get('archivada')
            if show_archived is None:
                # Por defecto mostrar no archivadas
                queryset = queryset.filter(archivada=False)
            elif show_archived.lower() == 'true':
                # Mostrar solo archivadas
                queryset = queryset.filter(archivada=True)
        
        return queryset

    def perform_create(self, serializer):
        """Crear tarea asociada al usuario actual."""
        serializer.save(usuario=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def aprobar(self, request, pk=None):
        """Aprobar una tarea pendiente."""
        tarea = self.get_object()
        
        # Verificar que es admin del proyecto o owner
        if tarea.proyecto_id:
            if not Miembro.objects.filter(
                proyecto=tarea.proyecto,
                usuario=request.user,
                rol=Miembro.Rol.ADMIN
            ).exists():
                return Response({'error': 'Solo admins pueden aprobar'}, status=403)
        
        if not tarea.pendiente_aprobacion:
            return Response({'error': 'Tarea no está pendiente de aprobación'}, status=400)
        
        tarea.aprobada = True
        tarea.pendiente_aprobacion = False
        tarea.save()
        return Response(TareaConProyectoSerializer(tarea, context={'request': request}).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Rechazar una tarea pendiente."""
        tarea = self.get_object()
        
        # Verificar que es admin del proyecto o owner
        if tarea.proyecto_id:
            if not Miembro.objects.filter(
                proyecto=tarea.proyecto,
                usuario=request.user,
                rol=Miembro.Rol.ADMIN
            ).exists():
                return Response({'error': 'Solo admins pueden rechazar'}, status=403)
        
        if not tarea.pendiente_aprobacion:
            return Response({'error': 'Tarea no está pendiente de aprobación'}, status=400)
        
        tarea.pendiente_aprobacion = False
        tarea.save()
        return Response(TareaConProyectoSerializer(tarea, context={'request': request}).data)


class SubtareaViewSet(viewsets.ModelViewSet):
    serializer_class = SubtareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Las subtareas pertenecen a las tareas del usuario
        return Subtarea.objects.filter(
            tarea__usuario=self.request.user
        ).order_by("orden", "id")

    def perform_create(self, serializer):
        # Auto-asignar orden si no se especifica
        if not serializer.validated_data.get("orden"):
            tarea = serializer.validated_data.get("tarea")
            # Verificar que la tarea pertenezca al usuario
            if tarea.usuario != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("No tienes permiso para agregar subtareas a esta tarea")
            max_orden = Subtarea.objects.filter(tarea=tarea).count()
            serializer.save(orden=max_orden)
        else:
            serializer.save()


# ============================================
# VIEWSETS PARA EQUIPOS
# ============================================

class EquipoViewSet(viewsets.ModelViewSet):
    """CRUD de equipos."""
    serializer_class = EquipoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo equipos donde el usuario es miembro
        miembro_equipo_ids = Miembro.objects.filter(
            usuario=self.request.user
        ).values_list('equipo_id', flat=True)
        return Equipo.objects.filter(id__in=miembro_equipo_ids)
    
    def perform_create(self, serializer):
        # El creador se agrega como ADMIN automáticamente
        equipo = serializer.save(creador=self.request.user)
        # Agregar creador como admin del equipo
        Miembro.objects.create(
            equipo=equipo,
            usuario=self.request.user,
            rol=Miembro.Rol.ADMIN
        )
    
    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[IsAuthenticated])
    def miembros(self, request, pk=None):
        """Gestionar miembros del equipo."""
        equipo = self.get_object()
        
        if request.method == 'GET':
            # Listar miembros
            miembros = equipo.miembros.all()
            return Response(MiembroSerializer(miembros, many=True).data)
        
        elif request.method == 'POST':
            # Agregar miembro
            usuario_id = request.data.get('usuario_id')
            rol = request.data.get('rol', Miembro.Rol.DEV)
            
            if not usuario_id:
                return Response({'error': 'usuario_id requerido'}, status=400)
            
            try:
                usuario = User.objects.get(id=usuario_id)
            except User.DoesNotExist:
                return Response({'error': 'Usuario no encontrado'}, status=404)
            
            # Verificar que no sea miembro ya
            if Miembro.objects.filter(equipo=equipo, usuario=usuario).exists():
                return Response({'error': 'El usuario ya es miembro'}, status=400)
            
            miembro = Miembro.objects.create(
                equipo=equipo,
                usuario=usuario,
                rol=rol
            )
            return Response(MiembroSerializer(miembro).data, status=201)
        
        elif request.method == 'DELETE':
            # Remover miembro
            miembro_id = request.data.get('miembro_id')
            if not miembro_id:
                return Response({'error': 'miembro_id requerido'}, status=400)
            
            try:
                miembro = Miembro.objects.get(id=miembro_id, equipo=equipo)
                # No permitir quitarnos a nosotros mismos (el último admin)
                if miembro.usuario == request.user:
                    admin_count = equipo.miembros.filter(rol=Miembro.Rol.ADMIN).count()
                    if admin_count <= 1:
                        return Response({'error': 'No puedes salir siendo el único admin'}, status=400)
                miembro.delete()
                return Response(status=204)
            except Miembro.DoesNotExist:
                return Response({'error': 'Miembro no encontrado'}, status=404)
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def proyectos(self, request, pk=None):
        """Listar/Crear proyectos del equipo."""
        equipo = self.get_object()
        
        if request.method == 'GET':
            proyectos = equipo.proyectos.all()
            return Response(ProyectoSerializer(proyectos, many=True).data)
        
        elif request.method == 'POST':
            # Crear proyecto en el equipo (solo admin)
            # Verificar que el usuario es admin del equipo
            miembro = Miembro.objects.filter(equipo=equipo, usuario=request.user, rol=Miembro.Rol.ADMIN).first()
            if not miembro:
                return Response({'error': 'Solo admins pueden crear proyectos'}, status=403)
            
            nombre = request.data.get('nombre')
            if not nombre:
                return Response({'error': 'nombre requerido'}, status=400)
            
            # Obtener icono - si es None, usar 'folder'
            icono = request.data.get('icono') or 'folder'
            color = request.data.get('color') or '#6366f1'
            
            proyecto = Proyecto.objects.create(
                equipo=equipo,
                nombre=nombre,
                descripcion=request.data.get('descripcion', ''),
                color=color,
                icono=icono,
                creador=request.user
            )
            return Response(ProyectoSerializer(proyecto).data, status=201)


# ============================================
# VIEWSETS PARA PROYECTOS
# ============================================

class ProyectoViewSet(viewsets.ModelViewSet):
    """CRUD de proyectos (pertenecen a un Equipo)."""
    serializer_class = ProyectoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo proyectos donde el usuario es miembro del equipo
        miembro_equipo_ids = Miembro.objects.filter(
            usuario=self.request.user
        ).values_list('equipo_id', flat=True)
        return Proyecto.objects.filter(equipo_id__in=miembro_equipo_ids)
    
    def perform_create(self, serializer):
        # El proyecto se crea en el equipo especificado y el creador es admin automáticamente
        proyecto = serializer.save(creador=self.request.user)
        # Agregar creador como admin del equipo (no del proyecto)
        equipo = proyecto.equipo
        Miembro.objects.get_or_create(
            equipo=equipo,
            usuario=self.request.user,
            defaults={'rol': Miembro.Rol.ADMIN}
        )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def tareas(self, request, pk=None):
        """Listar tareas del proyecto."""
        proyecto = self.get_object()
        tareas = proyecto.tareas.all()
        return Response(TareaConProyectoSerializer(tareas, many=True, context={'request': request}).data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def estados(self, request, pk=None):
        """Listar estados del equipo del proyecto."""
        proyecto = self.get_object()
        estados = Estado.objects.filter(equipo=proyecto.equipo).order_by("orden", "id")
        return Response(EstadoSerializer(estados, many=True).data)
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def mensajes(self, request, pk=None):
        """Chat del proyecto."""
        proyecto = self.get_object()
        
        if request.method == 'GET':
            # Últimos 100 mensajes
            mensajes = proyecto.mensajes.order_by('-timestamp')[:100]
            return Response(MensajeSerializer(mensajes, many=True).data)
        
        elif request.method == 'POST':
            # Enviar mensaje
            contenido = request.data.get('contenido')
            if not contenido:
                return Response({'error': 'contenido requerido'}, status=400)
            
            mensaje = Mensaje.objects.create(
                proyecto=proyecto,
                autor=request.user,
                contenido=contenido
            )
            return Response(MensajeSerializer(mensaje).data, status=201)


# Nota: MensajeViewSet ya no es necesario - la gestión de mensajes está en ProyectoViewSet