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

{/* Chat - DESACTIVADO */}
      {false && isInProject && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-all duration-300 hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      )}
          
          {/* Panel del chat */}
          {showChat && (
            <div className="fixed bottom-6 right-6 w-80 h-96 bg-[#1a1d29] rounded-2xl border border-white/10 shadow-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">Chat del Equipo</h3>
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Conectado' : 'Desconectado'}></span>
                </div>
                <button
                  onClick={() => {
                    setShowChat(false);
                    setSelectedChatUser(null);
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Lista de miembros o chat */}
              {!selectedChatUser ? (
                <div className="flex-1 overflow-y-auto p-2">
                  <p className="text-xs text-white/50 px-2 mb-2">Miembros del equipo</p>
                  {otrosMiembros.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-4">No hay otros miembros</p>
                  ) : (
                    otrosMiembros.map((miembro) => (
                      <button
                        key={miembro.id}
                        onClick={() => setSelectedChatUser(miembro)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{miembro.usuario?.email || "Usuario"}</p>
                          <p className="text-white/50 text-xs">{miembro.rol}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  {/* Chat con usuario */}
                  <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-white/5">
                    <button
                      onClick={() => setSelectedChatUser(null)}
                      className="text-white/60 hover:text-white"
                    >
                      ←
                    </button>
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <span className="text-white text-sm truncate">
                      {selectedChatUser.usuario?.email || "Usuario"}
                    </span>
                  </div>
                  
                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingMessages ? (
                      <p className="text-white/40 text-sm text-center">Cargando...</p>
                    ) : mensajes.length === 0 ? (
                      <p className="text-white/40 text-sm text-center">No hay mensajes</p>
                    ) : (
                      mensajes.map((msg, idx) => (
                        <div
                          key={msg.id || idx}
                          className={`flex ${msg.autor?.id === selectedChatUser?.usuario?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            msg.autor?.id === selectedChatUser?.usuario?.id 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-white/10 text-white'
                          }`}>
                            <span className="text-xs text-white/50 block mb-1">{msg.autor?.username}</span>
                            {msg.contenido}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Indicador de alguien escribiendo */}
                    {typingList.length > 0 && (
                      <div className="flex items-center gap-2 text-white/50 text-sm px-2">
                        <span className="flex gap-1">
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        <span>{typingList.join(', ')} {typingList.length === 1 ? 'está escribiendo' : 'están escribiendo'}...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Input de mensaje */}
                  <div className="p-2 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-indigo-500 rounded-lg text-white hover:bg-indigo-600 disabled:opacity-50 transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}