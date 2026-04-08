import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

// Función para obtener los estilos basados en el color hex del backend
function getStatusStyles(color) {
  // Mapear colores hex a clases de Tailwind para texto
  const textColorMap = {
    "#6b7280": "text-zinc-400",
    "#3b82f6": "text-blue-400",
    "#8b5cf6": "text-violet-400",
    "#10b981": "text-emerald-400",
    "#ef4444": "text-red-400",
    "#f97316": "text-orange-400",
    "#eab308": "text-yellow-400",
    "#ec4899": "text-pink-400",
    "#06b6d4": "text-cyan-400",
  };

  const textColor = textColorMap[color] || "text-zinc-400";
  
  return {
    badge: `text-white`,
    column: color || "#6b7280",
    add: textColor,
  };
}

export default function BoardColumn({ status, tasks, onAddTask, renderTask }) {
  const style = getStatusStyles(status.color);
  const isFinal = status.esFinal || false;

  // Convertir hex a rgba con 20% de opacidad para el fondo
  const hexToRgba = (hex, alpha = 0.2) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const isEmpty = tasks.length === 0;

  // Droppable para la columna
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <section 
      ref={setNodeRef}
      className={`w-[280px] sm:w-[300px] md:w-[330px] shrink-0 rounded-2xl md:rounded-3xl p-3 md:p-4 transition-colors ${
        isOver ? 'ring-2 ring-emerald-400' : ''
      }`}
      style={{ 
        backgroundColor: hexToRgba(style.column, 0.2),
        borderColor: isOver ? style.column : 'transparent',
        borderWidth: '2px',
        borderStyle: 'solid'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span 
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: style.column }}
          >
            {status.name.toUpperCase()}
          </span>
          <span className="text-lg text-white/70">{tasks.length}</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center py-8">
          {isFinal ? (
            <div className="w-full h-24 flex flex-col items-center justify-center text-slate-600">
              <span className="text-sm">No se pueden agregar tareas</span>
            </div>
          ) : (
            <button
              onClick={onAddTask}
              className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-400/50 transition"
            >
              <span className="text-3xl mb-1">+</span>
              <span className="text-sm">Agregar tarea</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            renderTask ? renderTask(task) : <TaskCard key={task.id} task={task} />
          ))}
          
          {/* Botón para agregar tarea al final de la columna - oculto si es estado final */}
          {!isFinal && (
            <button
              onClick={onAddTask}
              className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-400/50 transition mt-3"
            >
              <Plus size={18} />
              <span className="text-sm">Agregar tarea</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}