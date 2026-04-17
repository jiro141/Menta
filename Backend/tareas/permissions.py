from rest_framework.permissions import BasePermission


class AllowAuthOrAnon(BasePermission):
    """
    Permite acceso a:
    - Usuarios autenticados (cualquier ruta)
    - Usuarios no autenticados solo a /auth/login/ y /auth/register/
    """
    
    # Rutas públicas (sin autenticación)
    PUBLIC_PATHS = [
        '/api/auth/login/',
        '/api/auth/register/',
    ]
    
    def has_permission(self, request, view):
        # Si está autenticado, permitir todo
        if request.user and request.user.is_authenticated:
            return True
        
        # Si no está autenticado, verificar si es ruta pública
        path = request.path
        return path in self.PUBLIC_PATHS or any(path.startswith(p[:-1]) for p in self.PUBLIC_PATHS if p.endswith('/'))


# ============================================
# PERMISSION CLASSES PARA PROYECTOS (RBAC)
# ============================================

from .models import Miembro


class EsAdminProyecto(BasePermission):
    """Verifica que el usuario sea ADMIN del proyecto."""
    
    def has_permission(self, request, view):
        # Obtener proyecto_id de kwargs
        proyecto_id = view.kwargs.get('proyecto_id') or view.kwargs.get('pk')
        if not proyecto_id:
            return False
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        return Miembro.objects.filter(
            proyecto_id=proyecto_id,
            usuario=request.user,
            rol=Miembro.Rol.ADMIN
        ).exists()


class EsMiembroProyecto(BasePermission):
    """Verifica que el usuario sea miembro del proyecto."""
    
    def has_permission(self, request, view):
        # Obtener proyecto_id de kwargs
        proyecto_id = view.kwargs.get('proyecto_id') or view.kwargs.get('pk')
        if not proyecto_id:
            return False
        
        if not request.user or not request.user.is_authenticated:
            return False
        
        return Miembro.objects.filter(
            proyecto_id=proyecto_id,
            usuario=request.user
        ).exists()


class EsAdminProyectoOOwner(BasePermission):
    """ADMIN del proyecto O owner del recurso."""
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Si el objeto tiene proyecto, verificar rol de admin
        if hasattr(obj, 'proyecto_id') and obj.proyecto_id:
            return Miembro.objects.filter(
                proyecto_id=obj.proyecto_id,
                usuario=request.user,
                rol=Miembro.Rol.ADMIN
            ).exists()
        
        # Por defecto, verificar si es owner
        return hasattr(obj, 'usuario') and obj.usuario == request.user