import { useEffect } from "react";
import { createBrowserRouter, Navigate, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import BoardPage from "../pages/BoardPage";
import ListPage from "../pages/ListPage";
import CalendarPage from "../pages/CalendarPage";
import ArchivePage from "../pages/ArchivePage";
import EquiposPage from "../pages/EquiposPage";
import ProyectoPage from "../pages/ProyectoPage";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import { isAuthenticated, getEquipo } from "../api/auth";

// Componente que protege rutas y muestra toast si no hay auth
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Debes iniciar sesión primero");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  return children;
}

// Componente que protege rutas que requieren equipo seleccionado
function RequireEquipo({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Solo verificar en rutas que no sean equipos
  const isEquiposPage = location.pathname === "/app/equipos";
  
  useEffect(() => {
    if (!isEquiposPage) {
      const equipo = getEquipo();
      if (!equipo) {
        toast.error("Debes seleccionar un equipo primero");
        navigate("/app/equipos", { replace: true });
      }
    }
  }, [navigate, isEquiposPage]);

  // Si es la página de equipos, permitir siempre
  if (isEquiposPage) {
    return children;
  }

  // Verificar equipo antes de renderizar
  const equipo = getEquipo();
  if (!equipo) {
    return null;
  }

  return children;
}

// Componente que redirige si ya está autenticado
function AuthRedirect({ children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app/equipos", { replace: true });
    }
  }, [navigate]);

  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: (
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        ),
      },
      {
        path: "/register",
        element: (
          <AuthRedirect>
            <RegisterPage />
          </AuthRedirect>
        ),
      },
    ],
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/equipos" replace />,
      },
      {
        path: "board",
        element: <RequireEquipo><BoardPage /></RequireEquipo>,
      },
      {
        path: "list",
        element: <RequireEquipo><ListPage /></RequireEquipo>,
      },
      {
        path: "calendar",
        element: <RequireEquipo><CalendarPage /></RequireEquipo>,
      },
      {
        path: "dashboard",
        element: <RequireEquipo><DashboardPage /></RequireEquipo>,
      },
      {
        path: "equipos",
        element: <EquiposPage />,
      },
      {
        path: "proyecto/:proyectoId",
        element: <RequireEquipo><BoardPage /></RequireEquipo>,
      },
      {
        path: "proyecto/:proyectoId/board",
        element: <RequireEquipo><BoardPage /></RequireEquipo>,
      },
      {
        path: "proyecto/:proyectoId/list",
        element: <RequireEquipo><ListPage /></RequireEquipo>,
      },
      {
        path: "proyecto/:proyectoId/calendar",
        element: <RequireEquipo><CalendarPage /></RequireEquipo>,
      },
      {
        path: "archive",
        element: <RequireEquipo><ArchivePage /></RequireEquipo>,
      },
    ],
  },
]);
