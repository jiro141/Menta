import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import BoardView from "../components/board/BoardView";
import { useSearchStore } from "../stores/searchStore";
import { useEquipoStore } from "../stores/equipoStore";

export default function BoardPage() {
  const location = useLocation();
  const params = useParams();
  const { selectedTask, isModalOpen, clearSelection } = useSearchStore();
  const { equipoActual } = useEquipoStore();
  const [initialEditTask, setInitialEditTask] = useState(null);
  
  // Obtener proyectoId de los parámetros de la ruta
  const proyectoId = params.proyectoId;

  // Handle task selection from search or restore
  useEffect(() => {
    // Check if we have a task from search store (either direct or after restore)
    if (isModalOpen && selectedTask) {
      setInitialEditTask(selectedTask);
      clearSelection();
    }
    // Check if we have a task passed via navigation state
    else if (location.state?.editTask) {
      setInitialEditTask(location.state.editTask);
      window.history.replaceState({}, document.title);
    }
  }, [isModalOpen, selectedTask, location.state, clearSelection]);

  return <BoardView proyectoId={proyectoId} equipoId={equipoActual?.id} initialEditTask={initialEditTask} onEditHandled={() => setInitialEditTask(null)} />;
}