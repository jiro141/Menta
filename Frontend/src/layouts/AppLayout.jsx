import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import { useSearchStore } from "../stores/searchStore";
import { useBoardData } from "../hooks/useBoardData";
import { useEquipoStore } from "../stores/equipoStore";
import { useProyectoStore } from "../stores/proyectoStore";
import { useAuthStore } from "../stores/authStore";
import { getToken } from "../api/auth";
import toast from "react-hot-toast";
import { MessageCircle, X, Send, User } from "lucide-react";
import { getMensajes } from "../api/proyectos";
import { useChatWebSocket } from "../hooks/useChatWebSocket";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { selectedTask, showRestoreConfirm, clearSelection, confirmRestore, cancelRestore } = useSearchStore();
  const { refetch } = useBoardData();
  const { equipoActual, miembros, fetchMiembros } = useEquipoStore();
  const { proyecto, fetchProyecto } = useProyectoStore();
  const { user: currentUser } = useAuthStore();
  
  const [showChat, setShowChat] = useState(false); // DESACTIVADO
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Filtrar miembros excluding current user
  const otrosMiembros = miembros.filter(m => m.usuario?.id !== currentUser?.id);
  
  // Solo mostrar chat si estamos en un proyecto y hay equipo
  const isInProject = location.pathname.startsWith('/app/proyecto/') && params.proyectoId;
  const proyectoId = params.proyectoId;
  
  // Cargar proyecto cuando cambia el proyectoId
  useEffect(() => {
    if (proyectoId) {
      fetchProyecto(proyectoId);
    }
  }, [proyectoId]);
  
  // Cargar miembros del equipo cuando cambia el equipo
  useEffect(() => {
    if (equipoActual) {
      fetchMiembros(equipoActual.id);
    }
  }, [equipoActual?.id]);

  // Limpiar mensajes cuando cambia el proyecto
  useEffect(() => {
    if (proyectoId) {
      setMensajes([]);
      setSelectedChatUser(null);
    }
  }, [proyectoId]);
  
  // Cargar mensajes cuando se selecciona un usuario para chatear
  useEffect(() => {
    if (selectedChatUser && proyectoId) {
      loadMensajes();
    }
  }, [selectedChatUser, proyectoId]);
  
  const loadMensajes = async () => {
    if (!proyectoId) return;
    setLoadingMessages(true);
    try {
      const msgs = await getMensajes(proyectoId);
      setMensajes(msgs || []);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Callback cuando llega un nuevo mensaje por WebSocket
  const handleNewMessage = useCallback((data) => {
    // Agregar el nuevo mensaje a la lista
    setMensajes(prev => [...prev, {
      id: Date.now(), // Temporary ID
      contenido: data.contenido,
      autor: data.autor,
      timestamp: data.timestamp,
    }]);
  }, []);

  // Hook de WebSocket
  const { connected, sendMessage, sendTyping, typingList } = useChatWebSocket(
    proyectoId,
    handleNewMessage
  );

  // Manejar cuando el usuario escribe
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping();
    }
    // Limpiar timeout anterior y crear nuevo
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !proyectoId) return;
    
    // Intentar enviar por WebSocket primero
    const sentViaWs = sendMessage(newMessage.trim());
    
    // También guardar en BD por REST (para persistencia)
    try {
      const { getToken, apiFetch } = await import('../api/auth');
      const token = getToken();
      const response = await fetch(`/api/proyectos/${proyectoId}/mensajes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ contenido: newMessage.trim() }),
      });
      
      if (!response.ok) throw new Error('Error enviando mensaje');
    } catch (err) {
      console.error('Error guardando mensaje:', err);
    }
    
    setNewMessage("");
    setIsTyping(false);
  };

  // Handle restore confirmation

  // Handle restore confirmation
  const handleRestore = async () => {
    if (!selectedTask) return;
    
    try {
      const token = getToken();
      console.log("[DEBUG] Restoring task with ID:", selectedTask.id, "Original task:", selectedTask);
      
      const response = await fetch(`/api/tareas/${selectedTask.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ archivada: false }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error("[DEBUG] Restore failed:", response.status, data);
        throw new Error(data.detail || `Error ${response.status}: No se pudo restaurar`);
      }
      
      toast.success("Tarea restaurada");
      confirmRestore();
      navigate("/board");
      refetch();
    } catch (err) {
      console.error("[DEBUG] Restore error:", err);
      toast.error(err.message || "Error al restaurar tarea");
    }
  };

  return (
    <div className="h-screen bg-[#0a0f1c] text-white flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col md:ml-[88px]">
        <Topbar />
        <main className="flex-1 min-w-0 overflow-auto bg-[#06080d] text-white p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Tarea archivada</h2>
            <p className="text-white/60 mb-4 sm:mb-6 text-sm">
              La tarea "{selectedTask.title}" está archivada. ¿Deseas restaurarla para poder editarla?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  cancelRestore();
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
              >
                Restaurar
              </button>
            </div>
</div>
          </div>
        )}
      </div>
    </div>
  );
}