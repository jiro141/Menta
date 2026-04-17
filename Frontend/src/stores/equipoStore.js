import { create } from "zustand";
import * as equiposApi from "../api/equipos";
import * as authApi from "../api/auth";

export const useEquipoStore = create((set, get) => ({
  equipos: [],
  equipoActual: authApi.getEquipo(),
  proyectos: [],
  miembros: [],
  isLoading: false,
  error: null,

  // Cargar equipos del usuario
  fetchEquipos: async () => {
    set({ isLoading: true, error: null });
    try {
      const equipos = await equiposApi.getEquipos();
      
      // Verificar si el equipoActual guardado sigue siendo válido
      const savedEquipo = authApi.getEquipo();
      const equipoValido = savedEquipo && equipos.some(e => e.id === savedEquipo.id);
      
      set({ equipos, isLoading: false });
      
      // Limpiar equipo actual si ya no es válido
      if (!equipoValido) {
        set({ equipoActual: null });
        authApi.setEquipo(null);
      }
      
      // Si no hay equipo actual, usar el primero
      if (!equipoValido && equipos.length > 0) {
        set({ equipoActual: equipos[0] });
        authApi.setEquipo(equipos[0]);
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Seleccionar equipo actual
  selectEquipo: async (equipoId) => {
    const equipo = get().equipos.find(e => e.id === equipoId);
    if (equipo) {
      set({ equipoActual: equipo });
      authApi.setEquipo(equipo);
      // Cargar proyectos del equipo
      await get().fetchProyectos(equipoId);
    }
  },

  // Crear equipo
  createEquipo: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const equipo = await equiposApi.createEquipo(data);
      const equipos = [...get().equipos, equipo];
      set({ equipos, equipoActual: equipo, isLoading: false });
      authApi.setEquipo(equipo);
      return equipo;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Cargar proyectos del equipo
  fetchProyectos: async (equipoId) => {
    try {
      const proyectos = await equiposApi.getProyectos(equipoId);
      set({ proyectos });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Crear proyecto
  createProyecto: async (equipoId, data) => {
    set({ isLoading: true, error: null });
    try {
      const proyecto = await equiposApi.createProyecto(equipoId, data);
      const proyectos = [...get().proyectos, proyecto];
      set({ proyectos, isLoading: false });
      return proyecto;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Cargar miembros del equipo
  fetchMiembros: async (equipoId) => {
    try {
      const miembros = await equiposApi.getMiembros(equipoId);
      set({ miembros });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Agregar miembro
  addMiembro: async (equipoId, usuarioId, rol) => {
    set({ isLoading: true, error: null });
    try {
      const miembro = await equiposApi.addMiembro(equipoId, usuarioId, rol);
      const miembros = [...get().miembros, miembro];
      set({ miembros, isLoading: false });
      return miembro;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));