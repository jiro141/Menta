// En desarrollo usa proxy (localhost:8000), en producción usa redirect de Netlify
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? "/api" : "/api";

function getToken() {
  const token = localStorage.getItem("menta_token");
  
  // Verificar que el token sea un JWT válido (tiene 3 partes separadas por puntos)
  if (token && token.split('.').length !== 3) {
    console.warn("Token inválido encontrado, limpiando...");
    localStorage.removeItem("menta_token");
    localStorage.removeItem("menta_user");
    return null;
  }
  
  return token;
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  
  // No enviar Authorization header para rutas de auth
  const isAuthEndpoint = endpoint.startsWith('/auth/');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && !isAuthEndpoint && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  // Si el token es inválido (401), limpiar localStorage
  if (response.status === 401 && token && !isAuthEndpoint) {
    console.warn("Token rechazado por el servidor, limpiando...");
    localStorage.removeItem("menta_token");
    localStorage.removeItem("menta_user");
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.detail || data.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}
