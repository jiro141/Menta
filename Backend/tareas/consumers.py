import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Proyecto, Miembro, Mensaje


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer para chat de proyectos."""
    
    async def connect(self):
        self.proyecto_id = self.scope['url_route']['kwargs']['proyecto_id']
        self.room_group_name = f'chat_proyecto_{self.proyecto_id}'
        self.user = self.scope.get('user')
        
        # Verificar que el usuario es miembro del proyecto
        if self.user and self.user.is_authenticated:
            is_member = await self.check_member()
            if is_member:
                # Unirse al grupo del proyecto
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
                
                # Notificar conexión
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_connected',
                        'usuario': {
                            'id': self.user.id,
                            'username': self.user.username,
                        },
                        'proyecto_id': self.proyecto_id,
                    }
                )
            else:
                await self.close()
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Notificar desconexión
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_disconnected',
                    'usuario': {
                        'id': self.user.id,
                        'username': self.user.username,
                    },
                    'proyecto_id': self.proyecto_id,
                }
            )
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente."""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'escribiendo':
            # Broadcast de "está escribiendo" (sin guardar en BD)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'usuario': {
                        'id': self.user.id,
                        'username': self.user.username,
                    },
                    'proyecto_id': self.proyecto_id,
                }
            )
        elif message_type == 'mensaje':
            contenido = text_data_json.get('contenido', '')
            
            if contenido and self.user:
                # Guardar en BD
                mensaje = await self.save_message(contenido)
                
                # Broadcast a todos los miembros del grupo
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'proyecto_id': self.proyecto_id,
                        'autor': {
                            'id': self.user.id,
                            'username': self.user.username,
                        },
                        'contenido': contenido,
                        'timestamp': mensaje.timestamp.isoformat() if mensaje else None,
                    }
                )
    
    async def chat_message(self, event):
        """Manejar mensaje broadcast."""
        await self.send(text_data=json.dumps({
            'type': 'mensaje',
            'proyecto_id': event['proyecto_id'],
            'autor': event['autor'],
            'contenido': event['contenido'],
            'timestamp': event['timestamp'],
        }))
    
    async def user_typing(self, event):
        """Manejar notificación de escritura."""
        await self.send(text_data=json.dumps({
            'type': 'escribiendo',
            'usuario': event['usuario'],
            'proyecto_id': event['proyecto_id'],
        }))
    
    async def user_connected(self, event):
        """Manejar notificación de conexión."""
        await self.send(text_data=json.dumps({
            'type': 'usuarioConectado',
            'usuario': event['usuario'],
            'proyecto_id': event['proyecto_id'],
        }))
    
    async def user_disconnected(self, event):
        """Manejar notificación de desconexión."""
        await self.send(text_data=json.dumps({
            'type': 'usuarioDesconectado',
            'usuario': event['usuario'],
            'proyecto_id': event['proyecto_id'],
        }))
    
    @database_sync_to_async
    def check_member(self):
        """Verificar que el usuario es miembro del proyecto."""
        return Miembro.objects.filter(
            proyecto_id=self.proyecto_id,
            usuario=self.user
        ).exists()
    
    @database_sync_to_async
    def save_message(self, contenido):
        """Guardar mensaje en la base de datos."""
        return Mensaje.objects.create(
            proyecto_id=self.proyecto_id,
            autor=self.user,
            contenido=contenido
        )