import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProyectoStore } from "../stores/proyectoStore";
import { useEquipoStore } from "../stores/equipoStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import toast from "react-hot-toast";
import { Plus, ArrowLeft, Send } from "lucide-react";

export default function ProyectoPage() {
  const { proyectoId } = useParams();
  const navigate = useNavigate();
  
  const { 
    proyecto, 
    tareas, 
    estados, 
    fetchProyecto, 
    fetchTareas,
    createEstado,
    createTarea,
    moverTarea,
    fetchMensajes,
    mensajes,
    sendMensaje,
    isLoading,
    error 
  } = useProyectoStore();

  const { equipoActual } = useEquipoStore();

  const [showNewEstado, setShowNewEstado] = useState(false);
  const [showNewTarea, setShowNewTarea] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [newEstadoNombre, setNewEstadoNombre] = useState("");
  const [newTareaTitulo, setNewTareaTitulo] = useState("");
  const [newMensaje, setNewMensaje] = useState("");

  useEffect(() => {
    if (proyectoId) {
      fetchProyecto(proyectoId);
      fetchMensajes(proyectoId);
    }
  }, [proyectoId]);

  // Agrupar tareas por estado
  const tareasPorEstado = estados.reduce((acc, estado) => {
    acc[estado.id] = tareas.filter(t => t.estado === estado.id || t.estado_id === estado.id);
    return acc;
  }, {});

  const handleCreateEstado = async (e) => {
    e.preventDefault();
    if (!newEstadoNombre.trim() || !proyectoId) return;

    if (!equipoActual) {
      toast.error("Debes seleccionar un equipo primero");
      return;
    }
    
    await createEstado(proyectoId, {
      nombre: newEstadoNombre,
      color: "#" + Math.floor(Math.random()*16777215).toString(16),
      orden: estados.length,
      es_final: false
    });
    
    setNewEstadoNombre("");
    setShowNewEstado(false);
    fetchTareas(proyectoId);
  };

  const handleCreateTarea = async (e) => {
    e.preventDefault();
    if (!newTareaTitulo.trim() || !proyectoId) return;
    
    await createTarea(proyectoId, {
      titulo: newTareaTitulo,
      descripcion: "",
      estado_id: estadoSeleccionado || (estados[0]?.id)
    });
    
    setNewTareaTitulo("");
    setShowNewTarea(false);
    setEstadoSeleccionado(null);
  };

  const handleMoverTarea = async (tareaId, nuevoEstadoId) => {
    await moverTarea(tareaId, nuevoEstadoId);
    fetchTareas(proyectoId);
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!newMensaje.trim() || !proyectoId) return;
    
    await sendMensaje(proyectoId, newMensaje);
    setNewMensaje("");
  };

  if (!proyecto) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/app/equipos")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{proyecto.nombre}</h1>
            <p className="text-sm text-gray-500">{equipoActual?.nombre}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowNewEstado(true)}>
            + Estado
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Board Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full">
          {/* Columnas de estados */}
          {estados.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">No hay estados en este proyecto</p>
                <Button onClick={() => setShowNewEstado(true)}>
                  Crear primer estado
                </Button>
              </div>
            </div>
          ) : estados.map((estado) => (
            <div 
              key={estado.id} 
              className="w-72 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg"
            >
              {/* Header de columna */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: estado.color }}
                  />
                  <h3 className="font-semibold text-gray-700">{estado.nombre}</h3>
                  <span className="text-xs text-gray-500">
                    ({tareasPorEstado[estado.id]?.length || 0})
                  </span>
                </div>
              </div>

              {/* Tareas en el estado */}
              <div className="flex-1 p-2 overflow-y-auto space-y-2">
                {tareasPorEstado[estado.id]?.map((tarea) => (
                  <div 
                    key={tarea.id}
                    className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (!estado.es_final) {
                        setEstadoSeleccionado(estado.id);
                        setShowNewTarea(true);
                      }
                    }}
                  >
                    <p className="text-gray-900 font-medium">{tarea.titulo}</p>
                    {tarea.descripcion && (
                      <p className="text-sm text-gray-500 mt-1">{tarea.descripcion}</p>
                    )}
                    
                    {/* Estado de aprobación */}
                    {tarea.pendiente_aprobacion && (
                      <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        Pendiente aprobación
                      </div>
                    )}
                    {tarea.aprobada && (
                      <div className="mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        Aprobada
                      </div>
                    )}
                  </div>
                ))}

                {/* Botón 添加 tarea */}
                {!estado.es_final && (
                  <button
                    onClick={() => {
                      setEstadoSeleccionado(estado.id);
                      setShowNewTarea(true);
                    }}
                    className="w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar tarea</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat lateral */}
      <div className="w-72 border-l bg-gray-50 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold">Chat del equipo</h3>
        </div>
        
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mensajes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay mensajes todavía
            </p>
          ) : mensajes.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="font-medium">{msg.autor?.email}:</span>
              <p className="text-gray-700">{msg.contenido}</p>
            </div>
          ))}
        </div>

        {/* Input mensaje */}
        <div className="p-3 border-t">
          <form onSubmit={handleEnviarMensaje} className="flex gap-2">
            <Input
              placeholder="Mensaje..."
              value={newMensaje}
              onChange={(e) => setNewMensaje(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Modal nuevo estado */}
      {showNewEstado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateEstado} className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Nuevo Estado</h3>
            <Input
              placeholder="Nombre del estado"
              value={newEstadoNombre}
              onChange={(e) => setNewEstadoNombre(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Crear
              </Button>
              <Button variant="secondary" onClick={() => setShowNewEstado(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modal nueva tarea */}
      {showNewTarea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateTarea} className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Nueva Tarea</h3>
            <Input
              placeholder="Título de la tarea"
              value={newTareaTitulo}
              onChange={(e) => setNewTareaTitulo(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                Crear
              </Button>
              <Button variant="secondary" onClick={() => setShowNewTarea(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}