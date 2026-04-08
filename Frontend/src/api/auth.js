import { apiFetch } from "./client";

const TOKEN_KEY = "menta_token";
const USER_KEY = "menta_user";

export async function login(email, password) {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.access) {
    localStorage.setItem(TOKEN_KEY, data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
  }

  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated() {
  return !!getToken();
}
