import { useEffect } from "react";
import { createBrowserRouter, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import BoardPage from "../pages/BoardPage";
import ListPage from "../pages/ListPage";
import CalendarPage from "../pages/CalendarPage";
import ArchivePage from "../pages/ArchivePage";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import { isAuthenticated } from "../api/auth";

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

// Componente que redirige si ya está autenticado
function AuthRedirect({ children }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app/board", { replace: true });
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
        element: <Navigate to="/app/board" replace />,
      },
      {
        path: "board",
        element: <BoardPage />,
      },
      {
        path: "list",
        element: <ListPage />,
      },
      {
        path: "calendar",
        element: <CalendarPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "archive",
        element: <ArchivePage />,
      },
    ],
  },
]);
