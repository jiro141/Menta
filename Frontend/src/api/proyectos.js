import { apiFetch } from "./client";

//.Get proyecto específico
export async function getProyecto(proyectoId) {
  return apiFetch(`/proyectos/${proyectoId}/`);
}

// Obtener tareas del proyecto
export async function getTareas(proyectoId) {
  return apiFetch(`/proyectos/${proyectoId}/tareas/`);
}

// Obtener estados del proyecto (vienen con las tareas)
export async function getEstados(proyectoId) {
  // Los estados son globales del equipo, los obtenemos de la API de estados
  return apiFetch(`/estados/`);
}

// Crear estado en el proyecto
export async function createEstado(proyectoId, data) {
  return apiFetch("/estados/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Actualizar estado
export async function updateEstado(estadoId, data) {
  return apiFetch(`/estados/${estadoId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Eliminar estado
export async function deleteEstado(estadoId) {
  return apiFetch(`/estados/${estadoId}/`, {
    method: "DELETE",
  });
}

// Crear tarea en el proyecto
export async function createTarea(proyectoId, data) {
  return apiFetch(`/proyectos/${proyectoId}/tareas/`, {
    method: "POST",
    body: JSON.stringify({ ...data, proyecto_id: proyectoId }),
  });
}

// Actualizar tarea (mover entre estados)
export async function updateTarea(tareaId, data) {
  return apiFetch(`/tareas/${tareaId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Aprobar tarea (solo admin)
export async function aprobarTarea(tareaId) {
  return apiFetch(`/tareas/${tareaId}/aprobar/`, {
    method: "POST",
  });
}

// Rechazar tarea (solo admin)
export async function rechazarTarea(tareaId) {
  return apiFetch(`/tareas/${tareaId}/reject/`, {
    method: "POST",
  });
}

// Obtener mensajes del chat del proyecto
export async function getMensajes(proyectoId) {
  return apiFetch(`/proyectos/${proyectoId}/mensajes/`);
}

// Enviar mensaje
export async function sendMensaje(proyectoId, contenido) {
  return apiFetch(`/proyectos/${proyectoId}/mensajes/`, {
    method: "POST",
    body: JSON.stringify({ contenido }),
  });
}