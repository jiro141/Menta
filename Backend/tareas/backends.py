from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
            
        try:
            # Buscar usuario por email
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            # Si no encuentra por email, intentar por username
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return None

        # Verificar contraseña
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
            
        return None
