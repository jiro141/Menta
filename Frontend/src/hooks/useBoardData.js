import { useEffect, useState, useCallback } from "react";
import { getEstados, getEtiquetas, getTareas, getArchivedTareas, getTareasPorProyecto } from "../api/tasks";
import { useEquipoStore } from "../stores/equipoStore";
import { adaptBackendToBoardData } from "../api/adapters";

export function useBoardData(proyectoId) {
  const [data, setData] = useState({
    statuses: [],
    tasks: [],
    etiquetas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { equipoActual } = useEquipoStore.getState();
      const equipoId = equipoActual?.id;
      let estados;

      let tareas, etiquetas;

      if (proyectoId) {
        [tareas, etiquetas] = await Promise.all([
          getTareasPorProyecto(proyectoId),
          getEtiquetas(),
        ]);

        if (equipoId) {
          estados = await getEstados(equipoId);
        } else {
          estados = await getEstados();
        }
      } else {
        [tareas, estados, etiquetas] = await Promise.all([
          getTareas(),
          getEstados(),
          getEtiquetas(),
        ]);
      }

      const adapted = adaptBackendToBoardData(tareas, estados || [], etiquetas || []);
      setData({
        ...adapted,
        etiquetas: etiquetas,
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del backend.");
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
  };
}

export function useArchivedTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadArchived = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [tareas, estados, etiquetas] = await Promise.all([
        getArchivedTareas(),
        getEstados(),
        getEtiquetas(),
      ]);

      const adapted = adaptBackendToBoardData(tareas, estados, etiquetas);
      setTasks(adapted.tasks);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las tareas archivadas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchived();
  }, [loadArchived]);

  return {
    tasks,
    loading,
    error,
    refetch: loadArchived,
  };
}