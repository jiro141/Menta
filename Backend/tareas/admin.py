from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Estado, Etiqueta, Tarea, Subtarea


# Custom User admin que usa email para login
class UserAdmin(BaseUserAdmin):
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    list_display = ("username", "email", "is_staff", "is_active")
    search_fields = ("username", "email")


# Reemplazar el admin de User
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre")
    search_fields = ("nombre",)


@admin.register(Etiqueta)
class EtiquetaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "color")
    search_fields = ("nombre",)


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "titulo",
        "estado",
        "fecha_creacion",
        "fecha_inicio",
        "fecha_fin",
    )
    list_filter = ("estado", "fecha_creacion", "fecha_inicio", "fecha_fin")
    search_fields = ("titulo", "descripcion")
    filter_horizontal = ("etiquetas",)


@admin.register(Subtarea)
class SubtareaAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "tarea", "completada")
    list_filter = ("completada",)
    search_fields = ("titulo",)
