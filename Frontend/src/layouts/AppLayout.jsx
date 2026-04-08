import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";
import { useSearchStore } from "../stores/searchStore";
import { useBoardData } from "../hooks/useBoardData";
import { getToken } from "../api/auth";
import toast from "react-hot-toast";

export default function AppLayout() {
  const navigate = useNavigate();
  const { selectedTask, showRestoreConfirm, clearSelection, confirmRestore, cancelRestore } = useSearchStore();
  const { refetch } = useBoardData();

  // Handle restore confirmation
  const handleRestore = async () => {
    if (!selectedTask) return;
    
    try {
      const token = getToken();
      console.log("[DEBUG] Restoring task with ID:", selectedTask.id, "Original task:", selectedTask);
      
      const response = await fetch(`/api/tareas/${selectedTask.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ archivada: false }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error("[DEBUG] Restore failed:", response.status, data);
        throw new Error(data.detail || `Error ${response.status}: No se pudo restaurar`);
      }
      
      toast.success("Tarea restaurada");
      confirmRestore();
      navigate("/board");
      refetch();
    } catch (err) {
      console.error("[DEBUG] Restore error:", err);
      toast.error(err.message || "Error al restaurar tarea");
    }
  };

  return (
    <div className="h-screen bg-[#0a0f1c] text-white flex overflow-hidden">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col md:ml-[88px]">
        <Topbar />
        <main className="flex-1 min-w-0 overflow-auto bg-[#06080d] text-white p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Tarea archivada</h2>
            <p className="text-white/60 mb-4 sm:mb-6 text-sm">
              La tarea "{selectedTask.title}" está archivada. ¿Deseas restaurarla para poder editarla?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  cancelRestore();
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}