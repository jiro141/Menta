import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BoardView from "../components/board/BoardView";
import { useSearchStore } from "../stores/searchStore";

export default function BoardPage() {
  const location = useLocation();
  const { selectedTask, isModalOpen, clearSelection } = useSearchStore();
  const [initialEditTask, setInitialEditTask] = useState(null);

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

  return <BoardView initialEditTask={initialEditTask} onEditHandled={() => setInitialEditTask(null)} />;
}