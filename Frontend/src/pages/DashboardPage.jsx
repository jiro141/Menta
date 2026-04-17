import { useState } from "react";
import { useBoardData } from "../hooks/useBoardData";
import CreateTaskModal from "../components/ui/CreateTaskModal";
import { createTarea } from "../api/tasks";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useBoardData();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const handleCreateTask = async (taskData, subtareas = []) => {
    try {
      setCreatingTask(true);
      const estadoId = selectedStatus?.id || (taskData.estado ? parseInt(taskData.estado) : null);

      await createTarea({
        titulo: taskData.titulo,
        descripcion: taskData.descripcion,
        estado_id: estadoId,
        etiquetas_ids: taskData.etiquetas || [],
        fecha_inicio: taskData.fecha_inicio || null,
        fecha_fin: taskData.fecha_fin || null,
      }, subtareas);

      toast.success("Tarea creada");
      setShowTaskModal(false);
      setSelectedStatus(null);
      refetch();
    } catch (err) {
      toast.error("Error al crear tarea");
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Cargando...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  // Calcular estadísticas reales
  const pendingTasks = data.tasks?.filter(t => {
    const status = data.statuses?.find(s => String(s.id) === String(t.status));
    return status && !status.esFinal;
  }).length || 0;

  const inProgressTasks = data.tasks?.filter(t => {
    const status = data.statuses?.find(s => String(s.id) === String(t.status));
    return status && !status.esFinal;
  }).length || 0;

  const completedTasks = data.tasks?.filter(t => {
    const status = data.statuses?.find(s => String(s.id) === String(t.status));
    return status && status.esFinal;
  }).length || 0;

  const totalTasks = data.tasks?.length || 0;

  return (
    <div className="space-y-6 min-h-full bg-[#06080d] text-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Bienvenido al workspace principal de Menta.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedStatus(null);
            setShowTaskModal(true);
          }}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition"
        >
          <span className="text-sm sm:text-lg">+</span>
          <span className="hidden xs:inline">Nueva tarea</span>
          <span className="xs:hidden">Nueva</span>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total de tareas" value={totalTasks} />
        <Card title="Tareas pendientes" value={pendingTasks} />
        <Card title="En progreso" value={inProgressTasks} />
        <Card title="Completadas" value={completedTasks} />
      </div>

      <div className="rounded-3xl bg-[#1a1d29] p-6 border border-white/10 min-h-[360px]">
        <h2 className="text-xl font-semibold mb-2">Área principal</h2>
        <p className="text-slate-400">
          Aquí irá luego tu board tipo Trello / ClickUp.
        </p>
      </div>

      {/* Modal para crear tarea */}
      <CreateTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedStatus(null);
        }}
        onSubmit={handleCreateTask}
        statuses={data.statuses || []}
        etiquetas={data.etiquetas || []}
        loading={creatingTask}
        selectedStatus={selectedStatus}
      />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-3xl bg-[#1a1d29] p-5 border border-white/10">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="text-3xl font-bold mt-2 text-white">{value}</h3>
    </div>
  );
}