import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '../api/auth';

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws://'}${window.location.host}/ws/chat`;

export function useChatWebSocket(proyectoId, onNewMessage) {
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map()); // userId -> {username, timeout}
  const typingTimeoutsRef = useRef({}); // Para limpiar timeouts
  const wsRef = useRef(null);
  const userIdRef = useRef(null);

  // Obtener userId del token
  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userIdRef.current = payload.user_id;
      }
    } catch (e) {
      console.error('Error decode token:', e);
    }
  }, []);

  // Conectar al WebSocket
  useEffect(() => {
    if (!proyectoId || !userIdRef.current) return;

    const wsUrl = `${WS_URL}${proyectoId}/`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnected(true);
      console.log('[ChatWS] Conectado al chat del proyecto', proyectoId);
    };

    wsRef.current.onclose = () => {
      setConnected(false);
      console.log('[ChatWS] Desconectado del chat');
    };

    wsRef.current.onerror = (err) => {
      console.error('[ChatWS] Error:', err);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'mensaje':
            if (onNewMessage) {
              onNewMessage(data);
            }
            break;
            
          case 'escribiendo':
            handleTyping(data.usuario.id, data.usuario.username);
            break;
            
          case 'usuarioConectado':
          case 'usuarioDesconectado':
            console.log('[ChatWS]', data.type, data.usuario.username);
            break;
            
          default:
            console.log('[ChatWS] Tipo desconocido:', data.type);
        }
      } catch (e) {
        console.error('[ChatWS] Error parseando mensaje:', e);
      }
    };

    return () => {
      // Limpiar todos los timeouts
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [proyectoId, onNewMessage]);

  // Manejar "usuario escribiendo"
  const handleTyping = (userId, username) => {
    if (userId === userIdRef.current) return;

    // Limpiar timeout anterior si existe
    if (typingTimeoutsRef.current[userId]) {
      clearTimeout(typingTimeoutsRef.current[userId]);
    }

    // Nuevo timeout - después de 3 segundos se deja de mostrar
    typingTimeoutsRef.current[userId] = setTimeout(() => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      delete typingTimeoutsRef.current[userId];
    }, 3000);

    // Agregar usuario a la lista
    setTypingUsers(prev => {
      const next = new Map(prev);
      next.set(userId, { username });
      return next;
    });
  };

  // Enviar mensaje
  const sendMessage = useCallback((contenido) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mensaje',
        contenido
      }));
      return true;
    }
    return false;
  }, []);

  // Notificar que estoy escribiendo
  const sendTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'escribiendo'
      }));
    }
  }, []);

  // Obtener lista de usuarios escribiendo (para mostrar en UI)
  const typingList = Array.from(typingUsers.values()).map(u => u.username);

  return {
    connected,
    sendMessage,
    sendTyping,
    typingList
  };
}