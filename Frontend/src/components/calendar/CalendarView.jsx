import { useState } from "react";
import CalendarGrid from "./CalendarGrid";
import { useBoardData } from "../../hooks/useBoardData";
import { getToken } from "../../api/auth";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import CreateTaskModal from "../ui/CreateTaskModal";
import { createTarea, updateTarea } from "../../api/tasks";

export default function CalendarView() {
  const { data, loading, error, refetch } = useBoardData();
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [newEstado, setNewEstado] = useState({ nombre: "", color: "#6b7280" });
  const [estadoError, setEstadoError] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal de tarea
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);

  const handleTaskClick = (task) => {
    // task can be either an ID (string) or the full task object
    if (task && typeof task === 'object') {
      setEditTask(task);
      setShowTaskModal(true);
    } else {
      // Legacy support for taskId (string/number)
      const foundTask = data.tasks.find(t => t.id === String(task));
      if (foundTask) {
        setEditTask(foundTask);
        setShowTaskModal(true);
      }
    }
  };

  const handleCreateTask = async (taskData, subtareas = []) => {
    try {
      setCreatingTask(true);
      const estadoId = selectedStatus?.id || (taskData.estado ? parseInt(taskData.estado) : null);

      await createTarea({
        titulo: taskData.titulo,
        descripcion: taskData.descripcion,
        estado_id: estadoId,
        etiquetas_ids: taskData.etiquetas || [],
        fecha_inicio: taskData.fecha_inicio || null,
        fecha_fin: taskData.fecha_fin || null,
      }, subtareas);

      toast.success("Tarea creada");
      setShowTaskModal(false);
      setSelectedStatus(null);
      refetch();
    } catch (err) {
      toast.error("Error al crear tarea");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleUpdateTask = async (taskId, taskData, subtareas = []) => {
    const estadoId = taskData.estado ? parseInt(taskData.estado) : null;
    
    await updateTarea(taskId, {
      titulo: taskData.titulo,
      descripcion: taskData.descripcion,
      estado_id: estadoId,
      etiquetas_ids: taskData.etiquetas || [],
      fecha_inicio: taskData.fecha_inicio || null,
      fecha_fin: taskData.fecha_fin || null,
    }, subtareas);
    
    setEditTask(null);
    refetch();
  };

  const handleCreateEstado = async () => {
    const nombre = newEstado.nombre.trim();
    setEstadoError("");

    if (!nombre) {
      setEstadoError("El nombre es requerido");
      return;
    }

    if (nombre.length < 5) {
      setEstadoError("El nombre debe tener al menos 5 caracteres");
      return;
    }

    if (/^[0-9\W]/.test(nombre)) {
      setEstadoError("No puede iniciar con número o signo");
      return;
    }

    try {
      setCreating(true);
      const token = getToken();
      const response = await fetch("/api/estados/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          nombre: nombre,
          color: newEstado.color,
          orden: data.statuses.length,
        }),
      });

      const errorData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = errorData.nombre?.[0] || errorData.detail || "Error al crear estado";
        throw new Error(errorMsg);
      }

      toast.success("Estado creado");
      setShowEstadoModal(false);
      setNewEstado({ nombre: "", color: "#6b7280" });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Cargando...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  const hasStatuses = data.statuses && data.statuses.length > 0;

  // Filtrar tareas que tienen fecha_fin para mostrar en el calendario
  const tasksWithDates = data.tasks.filter((task) => task.endDate);

  return (
    <div className="space-y-4 sm:space-y-6 min-h-full text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Calendario</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Vista mensual de tareas por fecha de fin.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStatus(null);
            setEditTask(null);
            setShowTaskModal(true);
          }}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition"
        >
          <span className="text-sm sm:text-lg">+</span>
          <span className="hidden xs:inline">Nueva tarea</span>
          <span className="xs:hidden">Nueva</span>
        </button>
      </div>

      {hasStatuses ? (
        <div className="w-full">
          <CalendarGrid 
            tasks={tasksWithDates} 
            statuses={data.statuses}
            onTaskClick={handleTaskClick}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          <CalendarDays size={48} sm:size={64} className="text-slate-600 mb-4 sm:mb-6" />
          <div className="text-slate-400 mb-4 sm:mb-6 text-base sm:text-lg">
            No hay estados disponibles
          </div>
          <button
            onClick={() => setShowEstadoModal(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition"
          >
            Crear primer estado
          </button>
        </div>
      )}

      {showEstadoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Nuevo Estado</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newEstado.nombre}
                  onChange={(e) => {
                    setNewEstado({ ...newEstado, nombre: e.target.value });
                    setEstadoError("");
                  }}
                  placeholder="Ej: Pendiente, En progreso..."
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400"
                />
                {estadoError && (
                  <p className="text-red-400 text-sm mt-2">{estadoError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Color</label>
                <div className="flex gap-3">
                  {["#6b7280", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f97316", "#eab308", "#ec4899", "#06b6d4"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEstado({ ...newEstado, color })}
                      className={`w-10 h-10 rounded-full transition ${
                        newEstado.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1d29]" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowEstadoModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEstado}
                disabled={creating}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear/editar tarea */}
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedStatus(null);
          setEditTask(null);
        }}
        onSubmit={handleCreateTask}
        onUpdate={handleUpdateTask}
        editTask={editTask}
        statuses={data.statuses}
        etiquetas={data.etiquetas || []}
        loading={creatingTask}
        selectedStatus={selectedStatus}
      />
    </div>
  );
}
