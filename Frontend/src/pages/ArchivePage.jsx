import { useArchivedTasks } from "../hooks/useBoardData";
import { getToken } from "../api/auth";
import toast from "react-hot-toast";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useState } from "react";

export default function ArchivePage() {
  const { tasks, loading, error, refetch } = useArchivedTasks();
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleRestore = async (task) => {
    try {
      const token = getToken();
      const taskId = task.id;
      console.log("Restoring task ID:", taskId, "Original ID:", task.id);
      
      const response = await fetch(`/api/tareas/${taskId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ archivada: false }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("Restore error:", data);
        throw new Error(data.detail || "Error al restaurar");
      }
      
      toast.success("Tarea restaurada");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleDelete = (task) => {
    setConfirmModal({
      isOpen: true,
      type: "danger",
      title: "Eliminar Tarea",
      message: `¿Estás seguro de eliminar "${task.title}" permanentemente? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const token = getToken();
          const taskId = task.id;
          console.log("Deleting task ID:", taskId);
          
          const response = await fetch(`/api/tareas/${taskId}/`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          
          if (!response.ok) {
            const data = await response.json();
            console.error("Delete error:", data);
            throw new Error(data.detail || "Error al eliminar");
          }
          
          toast.success("Tarea eliminada");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          refetch();
        } catch (err) {
          console.error(err);
          toast.error(err.message);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 min-h-full bg-[#06080d] text-white">
        <div>
          <h1 className="text-3xl font-bold text-white">Archivo</h1>
          <p className="text-slate-400 mt-1">
            Tareas archivadas.
          </p>
        </div>
        <div className="text-slate-400">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 min-h-full bg-[#06080d] text-white">
        <div>
          <h1 className="text-3xl font-bold text-white">Archivo</h1>
          <p className="text-slate-400 mt-1">
            Tareas archivadas.
          </p>
        </div>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-h-full bg-[#06080d] text-white">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Archivo</h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">
          Tareas archivadas. Puedes restaurarlas o eliminarlas permanentemente.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <Archive size={48} sm={64} className="text-slate-600 mb-4 sm:mb-6" />
          <div className="text-slate-400 mb-2 text-base sm:text-lg">
            No hay tareas archivadas
          </div>
          <p className="text-slate-500 text-sm">
            Las tareas que archives aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="relative flex items-center justify-between p-3 sm:p-4 rounded-xl bg-[#181a20] border border-white/10 hover:bg-[#1e2228] transition-colors group"
            >
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {task.statusName && (
                    <span 
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ 
                        backgroundColor: task.statusColor ? `${task.statusColor}20` : "rgba(107, 114, 128, 0.2)",
                        color: task.statusColor || "#6b7280"
                      }}
                    >
                      {task.statusName}
                    </span>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ 
                            backgroundColor: tag.color ? `${tag.color}20` : "rgba(107, 114, 128, 0.2)",
                            color: tag.color || "#6b7280"
                          }}
                        >
                          {tag.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleRestore(task)}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                  title="Restaurar"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                  title="Eliminar permanentemente"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
