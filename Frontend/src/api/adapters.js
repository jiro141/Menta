export function adaptBackendToBoardData(tareas, estados, etiquetas) {
  const estadosMap = new Map(estados.map((estado) => [estado.id, estado]));
  const etiquetasMap = new Map(etiquetas.map((etiqueta) => [etiqueta.id, etiqueta]));

  // Usar los estados directamente del backend, no hardcodeados
  const statuses = estados.map((estado) => ({
    id: String(estado.id),
    name: estado.nombre,
    color: estado.color || "gray",
    orden: estado.orden || 0,
    backendId: estado.id,
    esFinal: estado.es_final || false,
  }));

  // Ordenar por el campo orden
  statuses.sort((a, b) => a.orden - b.orden);

  const tasks = tareas.map((tarea) => {
    // tarea.estado es el objeto completo del estado (serializado)
    // Por eso necesitamos obtener el ID directamente
    const estadoId = tarea.estado?.id || tarea.estado;
    
    // Obtener etiquetas de la relación many-to-many
    // Las etiquetas pueden venir como objetos o como IDs
    const tareaEtiquetas = tarea.etiquetas || [];
    const tags = tareaEtiquetas.map(e => {
      const etiquetaId = e.id || e;
      return etiquetasMap.get(etiquetaId);
    }).filter(Boolean);

    // Obtener subtareas
    const tareaSubtareas = tarea.subtareas || [];
    const subtasks = tareaSubtareas.map(s => ({
      id: s.id,
      titulo: s.titulo,
      completada: s.completada,
      orden: s.orden || 0,
    }));

    // Calcular progreso de subtareas
    const completedCount = subtasks.filter(s => s.completada).length;
    const totalCount = subtasks.length;

    // Si no hay fecha_inicio, usar fecha_creacion
    const fechaInicio = tarea.fecha_inicio || tarea.fecha_creacion?.split('T')[0] || null;

    return {
      id: tarea.id,  // Keep original numeric ID for API calls
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