import { apiFetch } from "./client";

export async function searchAll(query) {
  if (!query || query.trim().length === 0) {
    return { tareas: [], estados: [] };
  }
  
  return apiFetch(`/search/?q=${encodeURIComponent(query.trim())}`);
}