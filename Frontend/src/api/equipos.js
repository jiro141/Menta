import { apiFetch } from "./client";
import { setEquipo } from "./auth";

// Obtener todos los equipos del usuario
export async function getEquipos() {
  return apiFetch("/equipos/");
}

// Obtener un equipo específico
export async function getEquipo(equipoId) {
  return apiFetch(`/equipos/${equipoId}/`);
}

// Crear equipo
export async function createEquipo(data) {
  const result = await apiFetch("/equipos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  // Actualizar equipo activo
  if (result.id) {
    setEquipo(result);
  }
  return result;
}

// Actualizar equipo
export async function updateEquipo(equipoId, data) {
  return apiFetch(`/equipos/${equipoId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Eliminar equipo
export async function deleteEquipo(equipoId) {
  return apiFetch(`/equipos/${equipoId}/`, {
    method: "DELETE",
  });
}

// Obtener miembros del equipo
export async function getMiembros(equipoId) {
  return apiFetch(`/equipos/${equipoId}/miembros/`);
}

// Agregar miembro al equipo
export async function addMiembro(equipoId, usuarioId, rol = "DEV") {
  return apiFetch(`/equipos/${equipoId}/miembros/`, {
    method: "POST",
    body: JSON.stringify({ usuario_id: usuarioId, rol }),
  });
}

// Remover miembro del equipo
export async function removeMiembro(equipoId, miembroId) {
  return apiFetch(`/equipos/${equipoId}/miembros/`, {
    method: "DELETE",
    body: JSON.stringify({ miembro_id: miembroId }),
  });
}

// Obtener proyectos del equipo
export async function getProyectos(equipoId) {
  return apiFetch(`/equipos/${equipoId}/proyectos/`);
}

// Crear proyecto en el equipo
export async function createProyecto(equipoId, data) {
  return apiFetch(`/equipos/${equipoId}/proyectos/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Buscar usuarios por email para invitar
export async function searchUsers(query) {
  return apiFetch(`/search/users/?q=${encodeURIComponent(query)}`);
}