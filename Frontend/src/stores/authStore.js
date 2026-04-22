import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "../api/auth";
import { useEquipoStore } from "./equipoStore";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: authApi.getUser(),
      isAuthenticated: authApi.isAuthenticated(),
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return data;
        } catch (error) {
          set({
            error: error.message || "Error al iniciar sesión",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.register(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return data;
        } catch (error) {
          set({
            error: error.message || "Error al registrar usuario",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authApi.logout();
        useEquipoStore.getState().clearEquipos();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "menta-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
