export function adaptBackendToBoardData(tareas, estados, etiquetas) {
  console.log("[DEBUG] adapt - tareas:", tareas);
  console.log("[DEBUG] adapt - estados:", estados);
  
  if (!estados || estados.length === 0) {
    console.warn("[DEBUG] No hay estados!");
    return { statuses: [], tasks: [] };
  }
  
  if (!tareas || tareas.length === 0) {
    console.warn("[DEBUG] No hay tareas!");
    return { statuses: [], tasks: [] };
  }

  const estadosMap = new Map(estados.map((estado) => [estado.id, estado]));
  const etiquetasMap = new Map(etiquetas.map((etiqueta) => [etiqueta.id, etiqueta]));

  const statuses = estados.map((estado) => ({
    id: String(estado.id),
    name: estado.nombre,
    color: estado.color || "gray",
    orden: estado.orden || 0,
    backendId: estado.id,
    esFinal: estado.es_final || false,
  }));

  statuses.sort((a, b) => a.orden - b.orden);

  const tasks = tareas.map((tarea) => {
    const estadoId = tarea.estado?.id || tarea.estado;
    
    const tareaEtiquetas = tarea.etiquetas || [];
    const tags = tareaEtiquetas.map(e => {
      const etiquetaId = e.id || e;
      return etiquetasMap.get(etiquetaId);
    }).filter(Boolean);

    const tareaSubtareas = tarea.subtareas || [];
    const subtasks = tareaSubtareas.map(s => ({
      id: s.id,
      titulo: s.titulo,
      completada: s.completada,
      orden: s.orden || 0,
    }));

    const completedCount = subtasks.filter(s => s.completada).length;
    const totalCount = subtasks.length;
    const fechaInicio = tarea.fecha_inicio || tarea.fecha_creacion?.split('T')[0] || null;

    return {
      id: tarea.id,
      title: tarea.titulo,
      description: tarea.descripcion || "",
      status: estadoId ? String(estadoId) : null,
      statusName: estadoId ? (estadosMap.get(estadoId)?.nombre || null) : null,
      statusColor: estadoId ? (estadosMap.get(estadoId)?.color || null) : null,
      assignees: [],
      startDate: fechaInicio,
      endDate: tarea.fecha_fin || null,
      dueDate: tarea.fecha_fin || null,
      priority: "low",
      tags: tags,
      subtasks: subtasks,
      completedSubtasks: completedCount,
      totalSubtasks: totalCount,
      archived: tarea.archivada || false,
    };
  });

  return {
    statuses,
    tasks,
  };
}