import { create } from "zustand";
import * as proyectosApi from "../api/proyectos";
import * as equiposApi from "../api/equipos";

export const useProyectoStore = create((set, get) => ({
  proyecto: null,
  tareas: [],
  estados: [],
  mensajes: [],
  isLoading: false,
  error: null,

  // Cargar proyecto
  fetchProyecto: async (proyectoId) => {
    set({ isLoading: true, error: null });
    try {
      const proyecto = await proyectosApi.getProyecto(proyectoId);
      set({ proyecto, isLoading: false });
      
      // Cargar tareas y estados
      await get().fetchTareas(proyectoId);
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Cargar tareas del proyecto
  fetchTareas: async (proyectoId) => {
    try {
      const tareas = await proyectosApi.getTareas(proyectoId);
      set({ tareas });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Cargar estados (para el proyecto)
  fetchEstados: async (proyectoId) => {
    try {
      const allEstados = await proyectosApi.getEstados(proyectoId);
      // Filtrar estados que pertenecen al proyecto
      const estados = allEstados.filter(e => !e.proyecto || e.proyecto === parseInt(proyectoId));
      set({ estados });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Crear estado
  createEstado: async (proyectoId, data) => {
    set({ isLoading: true, error: null });
    try {
      const estado = await proyectosApi.createEstado(proyectoId, data);
      set({ estados: [...get().estados, estado], isLoading: false });
      return estado;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Crear tarea
  createTarea: async (proyectoId, data) => {
    set({ isLoading: true, error: null });
    try {
      const tarea = await proyectosApi.createTarea(proyectoId, data);
      set({ tareas: [...get().tareas, tarea], isLoading: false });
      return tarea;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Mover tarea a otro estado
  moverTarea: async (tareaId, estadoId) => {
    try {
      const tarea = await proyectosApi.updateTarea(tareaId, { estado_id: estadoId });
      const tareas = get().tareas.map(t => t.id === tareaId ? tarea : t);
      set({ tareas });
      return tarea;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Cargar mensajes
  fetchMensajes: async (proyectoId) => {
    try {
      const mensajes = await proyectosApi.getMensajes(proyectoId);
      set({ mensajes });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Enviar mensaje
  sendMensaje: async (proyectoId, contenido) => {
    try {
      const mensaje = await proyectosApi.sendMensaje(proyectoId, contenido);
      set({ mensajes: [mensaje, ...get().mensajes] });
      return mensaje;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));