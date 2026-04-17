import { CalendarDays, Flag, CheckSquare, Trash2, Archive } from "lucide-react";

export default function TaskCard({ task, onClick, onDelete, onArchive }) {
  // Formatear la fecha
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Fechas de inicio y fin
  const formattedStart = task.startDate ? formatDate(task.startDate) : null;
  const formattedEnd = task.endDate ? formatDate(task.endDate) : null;

  // Rango de fechas
  const dateRange = () => {
    if (formattedStart && formattedEnd) {
      return `${formattedStart} - ${formattedEnd}`;
    }
    if (formattedStart) {
      return formattedStart;
    }
    return null;
  };

  const dateRangeStr = dateRange();

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
    <article 
      className="relative rounded-3xl bg-[#181a20] border border-white/10 p-4 text-white shadow-sm hover:bg-[#1e2228] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      {/* Botones de acción (solo visible en hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onArchive && (
          <button
            onClick={handleArchiveClick}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            title="Archivar"
          >
            <Archive size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Título */}
      <h3 className="text-[18px] font-semibold leading-snug text-white pr-16">
        {task.title}
      </h3>

      {/* Etiquetas con banderas */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {task.tags && task.tags.length > 0 ? (
          task.tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium"
              style={{ 
                backgroundColor: tag.color ? `${tag.color}20` : "rgba(107, 114, 128, 0.2)",
                color: tag.color || "#6b7280"
              }}
            >
              <Flag size={12} />
              {tag.nombre}
            </div>
          ))
        ) : null}
      </div>

      {/* Subtareas progress */}
      {hasSubtasks && (
        <div className="mt-3 flex items-center gap-2">
          <CheckSquare size={14} className="text-emerald-400" />
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
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

      {/* Fechas */}
      {dateRangeStr && (
        <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
          <CalendarDays size={14} />
          <span>{dateRangeStr}</span>
        </div>
      )}
    </article>
  );
}
