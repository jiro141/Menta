import { apiFetch } from "./client";

const TOKEN_KEY = "menta_token";
const USER_KEY = "menta_user";
const EQUIPO_KEY = "menta_equipo";

export async function login(email, password) {
  // Limpiar equipo anterior antes de login
  localStorage.removeItem(EQUIPO_KEY);
  
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.access) {
    localStorage.setItem(TOKEN_KEY, data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // NO guardar equipo por defecto - se cargará del backend
    localStorage.removeItem(EQUIPO_KEY);
  }

  return data;
}

export async function register(email, password) {
  const data = await apiFetch("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.access) {
    localStorage.setItem(TOKEN_KEY, data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // El backend ya crea el equipo y lo devuelve en la respuesta
    if (data.equipo) {
      localStorage.setItem(EQUIPO_KEY, JSON.stringify(data.equipo));
    } else {
      localStorage.removeItem(EQUIPO_KEY);
    }
  }

  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EQUIPO_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function getEquipo() {
  const equipoStr = localStorage.getItem(EQUIPO_KEY);
  return equipoStr ? JSON.parse(equipoStr) : null;
}

export function setEquipo(equipo) {
  if (equipo) {
    localStorage.setItem(EQUIPO_KEY, JSON.stringify(equipo));
  } else {
    localStorage.removeItem(EQUIPO_KEY);
  }
}

export function isAuthenticated() {
  return !!getToken();
}
