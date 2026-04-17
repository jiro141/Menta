from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'estados', views.EstadoViewSet, basename='estado')
router.register(r'etiquetas', views.EtiquetaViewSet, basename='etiqueta')
router.register(r'tareas', views.TareaViewSet, basename='tarea')
router.register(r'subtareas', views.SubtareaViewSet, basename='subtarea')
router.register(r'equipos', views.EquipoViewSet, basename='equipo')
router.register(r'proyectos', views.ProyectoViewSet, basename='proyecto')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    path('search/', views.search_view, name='search'),
    path('search/users/', views.search_users_view, name='search_users'),
]
