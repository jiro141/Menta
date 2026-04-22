import { useState, useEffect } from "react";
import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard";
import { useBoardData } from "../../hooks/useBoardData";
import { createTarea, updateTarea, deleteTarea } from "../../api/tasks";
import { getToken } from "../../api/auth";
import CreateTaskModal from "../ui/CreateTaskModal";
import ConfirmModal from "../ui/ConfirmModal";
import toast from "react-hot-toast";
import { KanbanSquare } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableBoardColumn({ status, tasks, onAddTask, onEditTask, onDeleteTask, onArchiveTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardColumn 
        status={status} 
        tasks={tasks} 
        onAddTask={onAddTask}
        renderTask={(task) => (
          <SortableTaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
            onArchive={() => onArchiveTask(task)}
          />
        )}
      />
    </div>
  );
}

function SortableTaskCard({ task, onClick, onDelete, onArchive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `task-${task.id}`,
    data: { task, type: 'task' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} onDelete={onDelete} onArchive={onArchive} />
    </div>
  );
}

export default function BoardView({ proyectoId, equipoId, initialEditTask, onEditHandled }) {
  const { data, loading, error, refetch } = useBoardData(proyectoId);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [newEstado, setNewEstado] = useState({ nombre: "", color: "#6b7280", es_final: false });
  const [estadoError, setEstadoError] = useState("");
  const [creating, setCreating] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Handle initialEditTask from search
  useEffect(() => {
    if (initialEditTask) {
      setEditTask(initialEditTask);
      setShowTaskModal(true);
      onEditHandled?.();
    }
  }, [initialEditTask, onEditHandled]);

  // Modal de confirmación para eliminar/archivar
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "danger", // "danger" o "warning"
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Estado local para reorder con drag & drop
  const [statuses, setStatuses] = useState(data?.statuses || []);
  const [tasks, setTasks] = useState(data?.tasks || []);

  // Función para manejar edición de tarea
  const handleEditTask = (task) => {
    setEditTask(task);
    setShowTaskModal(true);
  };

  // Función para confirmar eliminación
  const handleDeleteTask = (task) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Eliminar Tarea",
      message: `¿Estás seguro de eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await deleteTarea(task.id);
          toast.success("Tarea eliminada");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          refetch();
        } catch (err) {
          toast.error("Error al eliminar tarea");
        }
      },
    });
  };

  // Función para confirmar archivado
  const handleArchiveTask = (task) => {
    setConfirmModal({
      isOpen: true,
      type: "warning",
      title: "Archivar Tarea",
      message: `¿Estás seguro de archivar "${task.title}"?`,
      onConfirm: async () => {
        try {
          const token = getToken();
          await fetch(`/api/tareas/${task.id}/`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ archivada: true }),
          });
          toast.success("Tarea archivada");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          refetch();
        } catch (err) {
          toast.error("Error al archivar tarea");
        }
      },
    });
  };

  // Función para actualizar tarea
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

  // Sincronizar estados y tareas cuando cambian los datos
  useEffect(() => {
    if (data?.statuses) {
      console.log("[DEBUG] BoardView - received statuses:", data.statuses.length);
      setStatuses(data.statuses);
    }
    if (data?.tasks) {
      console.log("[DEBUG] BoardView - received tasks:", data.tasks.length);
      setTasks(data.tasks);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // Si no hay dónde soltar
    if (!over) return;

    const activeData = active.data.current;
    const overId = over.id;

    // Verificar si es una tarea
    if (activeData?.type === 'task') {
      const task = activeData.task;
      
      // Verificar si se soltó sobre una columna (estado)
      const newStatus = statuses.find(s => s.id === overId);
      
      if (newStatus && task.status !== String(newStatus.id)) {
        // Verificar si el estado destino es un estado final
        if (newStatus.esFinal) {
          // Verificar si hay subtareas sin completar
          const totalSubtasks = task.totalSubtasks || 0;
          const completedSubtasks = task.completedSubtasks || 0;
          const pendingSubtasks = totalSubtasks - completedSubtasks;
          
          if (pendingSubtasks > 0) {
            toast.error(`Tienes ${pendingSubtasks} subtarea${pendingSubtasks > 1 ? 's' : ''} sin completar`);
            return;
          }
          
          // Mostrar modal de confirmación
          setConfirmModal({
            isOpen: true,
            type: "warning",
            title: "Completar Tarea",
            message: `¿Marcar "${task.title}" como completada? La tarea se moverá al estado "${newStatus.name}".`,
            onConfirm: async () => {
              try {
                const token = getToken();
                await fetch(`/api/tareas/${task.id}/`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                  },
                  body: JSON.stringify({
                    estado_id: parseInt(newStatus.id),
                  }),
                });
                
                toast.success(`Tarea completada y movida a ${newStatus.name}`);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                refetch();
              } catch (err) {
                toast.error("Error al mover tarea");
              }
            },
          });
        } else {
          // Mover normalmente si no es estado final
          try {
            const token = getToken();
            await fetch(`/api/tareas/${task.id}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                estado_id: parseInt(newStatus.id),
              }),
            });
            
            toast.success(`Tarea movida a ${newStatus.name}`);
            refetch();
          } catch (err) {
            toast.error("Error al mover tarea");
          }
        }
      }
      return;
    }

    // Si es una columna (reordenar estados)
    if (active.id !== overId) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === overId);

      const newOrder = arrayMove(statuses, oldIndex, newIndex);
      setStatuses(newOrder);

      // Enviar nuevo orden al backend
      try {
        const token = getToken();
        const ordenIds = newOrder.map((s) => s.id);
        await fetch("/api/estados/reorder/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ orden_ids: ordenIds }),
        });
        refetch();
      } catch (err) {
        console.error("Error al reorder:", err);
      }
    }
  };

  const handleCreateEstado = async () => {
    const nombre = newEstado.nombre.trim();
    setEstadoError("");

    // Validar que no esté vacío
    if (!nombre) {
      setEstadoError("El nombre es requerido");
      return;
    }

    // Validar mínimo 5 caracteres
    if (nombre.length < 5) {
      setEstadoError("El nombre debe tener al menos 5 caracteres");
      return;
    }

    // Validar que no inicie con número o signo
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
           es_final: newEstado.es_final || false,
           equipo_id: equipoId,
         }),
      });

      const errorData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Manejar errores del backend
        const errorMsg = errorData.nombre?.[0] || errorData.detail || "Error al crear estado";
        throw new Error(errorMsg);
      }

      toast.success("Estado creado");
      setShowEstadoModal(false);
      setNewEstado({ nombre: "", color: "#6b7280", es_final: false });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTask = async (taskData, subtareas = []) => {
    try {
      setCreatingTask(true);
      
      // Usar el estado seleccionado si existe, sino usar el del formData
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

  const handleAddTask = (status) => {
    setSelectedStatus(status);
    setShowTaskModal(true);
  };

  if (loading) {
    return <div className="text-slate-400">Cargando...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

const hasStatuses = statuses && statuses.length > 0;
  
  const etiquetas = tasks?.flatMap(t => t.tags || []) || [];
  const uniqueEtiquetas = [...new Map(etiquetas.map(e => [e.id, e])).values()];

  return (
    <div className="space-y-4 sm:space-y-6 min-h-full bg-[#06080d] text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Tablero</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Vista kanban de tareas por estado.
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {statuses.map((status) => {
              const statusTasks = tasks?.filter((task) => 
                task.status === String(status.id) || task.status === status.backendId
              );
              
              return (
                <SortableBoardColumn 
                  key={status.id}
                  status={status} 
                  tasks={statusTasks}
                  onAddTask={() => handleAddTask(status)}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onArchiveTask={handleArchiveTask}
                />
              );
            })}
            
            {/* Botón para crear más estados */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowEstadoModal(true)}
                className="w-32 sm:w-48 h-24 sm:h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg sm:rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-400/50 transition"
              >
                <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">+</span>
                <span className="text-xs sm:text-sm">Nuevo estado</span>
              </button>
            </div>
          </div>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          <KanbanSquare size={48} sm:size={64} className="text-slate-600 mb-4 sm:mb-6" />
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

      {/* Modal para crear estado */}
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

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="es_final"
                  checked={newEstado.es_final || false}
                  onChange={(e) => setNewEstado({ ...newEstado, es_final: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-400"
                />
                <label htmlFor="es_final" className="text-sm text-slate-300">
                  Estado final (las tareas aquí se consideran completadas)
                </label>
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

      {/* Modal para crear/editar tarea */}
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
        onEtiquetaCreated={() => {
          // Solo recargar etiquetas, no todo el board
          // refetch();
        }}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}