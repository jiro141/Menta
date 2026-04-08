import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import ListRow from "./ListRow";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function ListGroup({ status, tasks, onAddTask, onEditTask, onDeleteTask, onArchiveTask }) {
  // Usar el color del backend directamente
  const statusColor = status.color || "#6b7280";
  const isFinal = status.esFinal || false;

  // Convertir hex a rgba con 20% de opacidad para el fondo
  const hexToRgba = (hex, alpha = 0.2) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const isEmpty = tasks.length === 0;

  // Droppable para permitir soltar tareas en este grupo
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  });

  return (
    <section 
      ref={setNodeRef}
      className="rounded-3xl bg-[#0f1117] text-white border border-white/10 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ 
        backgroundColor: hexToRgba(statusColor, 0.2),
        borderColor: isOver ? '#10b981' : undefined,
      }}
    >
      <div className="px-5 py-4 flex items-center gap-3">
        <span 
          className="rounded-xl px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: statusColor }}
        >
          {status.name.toUpperCase()}
        </span>
        <span className="text-white/70">{tasks.length}</span>
      </div>

      {isEmpty ? (
        <div className="flex items-center justify-center py-12 border-t border-white/10">
          {isFinal ? (
            <div className="w-full mx-4 h-24 flex flex-col items-center justify-center text-slate-600">
              <span className="text-sm">No se pueden agregar tareas</span>
            </div>
          ) : (
            <button
              onClick={onAddTask}
              className="w-full mx-4 h-24 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-400/50 transition"
            >
              <span className="text-3xl mb-1">+</span>
              <span className="text-sm">Agregar tarea</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[1.6fr_200px_200px_80px] px-5 py-3 text-sm text-white/50 border-t border-white/10">
            <div>Nombre</div>
            <div>Fecha límite</div>
            <div>Etiquetas</div>
            <div className="text-right">Acciones</div>
          </div>

          {/* Mobile header */}
          <div className="md:hidden grid grid-cols-[1fr_60px] px-4 py-2 text-xs text-white/50 border-t border-white/10">
            <div>Nombre</div>
            <div className="text-right">Fecha</div>
          </div>

          <SortableContext
            items={tasks.map(t => `task-${t.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableListRow 
                key={task.id} 
                task={task} 
                onEditTask={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task)}
                onArchive={() => onArchiveTask(task)}
              />
            ))}
          </SortableContext>

          {/* Botón para agregar tarea al final - oculto si es estado final */}
          {!isFinal && (
            <div className="border-t border-white/10">
              <button
                onClick={onAddTask}
                className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 transition"
              >
                <Plus size={18} />
                <span className="text-sm">Agregar tarea</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SortableListRow({ task, onEditTask, onDelete, onArchive }) {
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
      <ListRow 
        task={task} 
        onEditTask={onEditTask} 
        onDelete={onDelete}
        onArchive={onArchive}
      />
    </div>
  );
}
