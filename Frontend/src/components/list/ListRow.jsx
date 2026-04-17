import { Trash2, Archive, CheckSquare } from "lucide-react";

export default function ListRow({ task, onEditTask, onDelete, onArchive }) {
  // Formatear la fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Progreso de subtareas
  const hasSubtasks = task.totalSubtasks > 0;
  const completedSubtasks = task.completedSubtasks || 0;
  const totalSubtasks = task.totalSubtasks || 0;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete && onDelete(task);
  };

  const handleArchiveClick = (e) => {
    e.stopPropagation();
    onArchive && onArchive(task);
  };

  return (
    <div 
      onClick={onEditTask}
      className="grid grid-cols-[1fr_60px] md:grid-cols-[1.6fr_200px_200px_80px] px-4 md:px-5 py-3 md:py-4 border-t border-white/10 items-center text-white hover:bg-white/5 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="w-4 h-4 rounded-full border border-white/40 shrink-0" />
        <span className="font-medium truncate text-sm md:text-base">{task.title}</span>

        {/* Progress de subtareas - solo desktop */}
        {hasSubtasks && (
          <div className="hidden md:flex items-center gap-2 ml-4">
            <CheckSquare size={14} className="text-emerald-400" />
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
            <span className="text-xs text-white/50">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}

        {/* Etiquetas - solo desktop */}
        <div className="hidden md:flex gap-1 flex-wrap">
          {task.tags && task.tags.length > 0 ? (
            task.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 rounded-md text-xs"
                style={{ 
                  backgroundColor: tag.color ? `${tag.color}20` : "rgba(107, 114, 128, 0.2)",
                  color: tag.color || "#6b7280"
                }}
              >
                {tag.nombre}
              </span>
            ))
          ) : null}
        </div>
      </div>

      {/* Desktop columns */}
      <div className="hidden md:block text-white/60">{formatDate(task.dueDate)}</div>

      {/* Mobile: solo fecha */}
      <div className="md:hidden text-white/60 text-sm">{formatDate(task.dueDate)}</div>

      {/* Desktop: etiquetas column */}
      <div className="hidden md:flex gap-1 flex-wrap">
        {task.tags && task.tags.length > 0 ? (
          task.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 rounded-md text-xs"
              style={{ 
                backgroundColor: tag.color ? `${tag.color}20` : "rgba(107, 114, 128, 0.2)",
                color: tag.color || "#6b7280"
              }}
            >
              {tag.nombre}
            </span>
          ))
        ) : (
          <span className="text-white/40">-</span>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-1 justify-end opacity-0 md:opacity-100 md:group-hover:opacity-100 transition-opacity">
        {onArchive && (
          <button
            onClick={handleArchiveClick}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-yellow-400 transition"
            title="Archivar"
          >
            <Archive size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
