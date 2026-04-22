import { apiFetch } from "./client";
import { getToken } from "./auth";

export async function getEstados(equipoId = null) {
  if (equipoId) {
    const result = await apiFetch(`/estados/?equipo_id=${equipoId}`);
    console.log("[API] getEstados(equipoId):", result);
    return result;
  }
  const result = await apiFetch("/estados/");
  console.log("[API] getEstados():", result);
  return result;
}

export async function getEstadosPorProyecto(proyectoId) {
  return apiFetch(`/proyectos/${proyectoId}/estados/`);
}

export async function getTareasPorProyecto(proyectoId) {
  const result = await apiFetch(`/proyectos/${proyectoId}/tareas/`);
  console.log("[API] getTareasPorProyecto:", result);
  return result;
}

export async function getTareas(archived = false) {
  const params = archived ? '?archivada=true' : '';
  return apiFetch(`/tareas/${params}`);
}

export async function getEtiquetas() {
  return apiFetch("/etiquetas/");
}

export async function getArchivedTareas() {
  return getTareas(true);
}

export async function createSubtarea(tareaId, titulo) {
  const token = getToken();
  
  const response = await fetch("/api/subtareas/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      tarea: tareaId,
      titulo: titulo,
      completada: false,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.detail || "Error al crear subtarea");
  }
  
  return result;
}

export async function updateSubtarea(id, data) {
  const token = getToken();
  
  const response = await fetch(`/api/subtareas/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.detail || "Error al actualizar subtarea");
  }
  
  return result;
}

export async function deleteSubtarea(id) {
  const token = getToken();
  
  const response = await fetch(`/api/subtareas/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || "Error al eliminar subtarea");
  }
  
  return true;
}

export async function createTarea(data, subtareas = []) {
  const token = getToken();
  
  const response = await fetch("/api/tareas/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.detail || "Error al crear tarea");
  }
  
  // Crear subtareas si existen
  if (subtareas.length > 0 && result.id) {
    for (const subtarea of subtareas) {
      try {
        await createSubtarea(result.id, subtarea.titulo);
      } catch (err) {
        console.error("Error creating subtarea:", err);
      }
    }
  }
  
  return result;
}

export async function updateTarea(id, data, subtareas = []) {
  const token = getToken();
  
  const response = await fetch(`/api/tareas/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.detail || "Error al actualizar tarea");
  }
  
  // Sincronizar subtareas
  if (subtareas && subtareas.length >= 0) {
    // Obtener subtareas actuales del backend
    try {
      const token = getToken();
      const currentResponse = await fetch(`/api/subtareas/?tarea=${id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const currentSubtareas = currentResponse.ok ? await currentResponse.json() : [];
      
      // Subtareas existentes en el frontend
      const frontendIds = new Set();
      
      for (const subtarea of subtareas) {
        if (subtarea.id && !String(subtarea.id).startsWith('temp-')) {
          // Actualizar subtarea existente
          frontendIds.add(subtarea.id);
          await updateSubtarea(subtarea.id, {
            titulo: subtarea.titulo,
            completada: subtarea.completada,
          });
        } else {
          // Crear nueva subtarea
          const created = await createSubtarea(id, subtarea.titulo);
          frontendIds.add(created.id);
        }
      }
      
      // Eliminar subtareas que ya no existen
      for (const current of currentSubtareas) {
        if (!frontendIds.has(current.id)) {
          await deleteSubtarea(current.id);
        }
      }
    } catch (err) {
      console.error("Error syncing subtasks:", err);
    }
  }
  
  return result;
}

export async function deleteTarea(id) {
  const token = getToken();
  
  const response = await fetch(`/api/tareas/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.detail || "Error al eliminar tarea");
  }
  
  return true;
}
