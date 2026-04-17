import { useState, useEffect, useRef } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { getToken } from "../../api/auth";
import toast from "react-hot-toast";
import { Flag, CheckSquare, Square, Trash2, Plus } from "lucide-react";
import DateRangePicker from "./DateRangePicker";

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  statuses = [], 
  etiquetas = [],
  loading = false,
  selectedStatus = null,
  editTask = null, // Objeto de tarea para editar
  onUpdate = null, // Función para actualizar tarea
  onUpdateSubtareas = null, // Función para actualizar subtareas
  onEtiquetaCreated = null // Callback cuando se crea una etiqueta nueva
}) {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    estado: "",
    fecha_inicio: "",
    fecha_fin: "",
    etiquetas: [],
  });

  const [errors, setErrors] = useState({});
  const [updating, setUpdating] = useState(false);
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);

  // Estado para crear nueva etiqueta
  const [showEtiquetaModal, setShowEtiquetaModal] = useState(false);
  const [newEtiqueta, setNewEtiqueta] = useState({ nombre: "", color: "#3b82f6" });
  const [etiquetaError, setEtiquetaError] = useState("");
  const [creatingEtiqueta, setCreatingEtiqueta] = useState(false);
  const etiquetaDropdownRef = useRef(null);
  const [etiquetaDropdownOpen, setEtiquetaDropdownOpen] = useState(false);

  // Estado para subtareas
  const [subtareas, setSubtareas] = useState([]);
  const [newSubtarea, setNewSubtarea] = useState("");

  // Reset form when modal opens or selectedStatus changes, or when editing
  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        // Modo edición - cargar datos de la tarea
        setFormData({
          titulo: editTask.title || "",
          descripcion: editTask.description || "",
          estado: editTask.status || "",
          fecha_inicio: editTask.startDate || "",
          fecha_fin: editTask.endDate || "",
          etiquetas: editTask.tags?.map(t => String(t.id)) || [],
        });
        // Cargar subtareas
        setSubtareas(editTask.subtasks || []);
      } else {
        // Modo creación - fecha_inicio es hoy por defecto
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          titulo: "",
          descripcion: "",
          estado: selectedStatus?.id?.toString() || selectedStatus?.backendId?.toString() || "",
          fecha_inicio: today,
          fecha_fin: "",
          etiquetas: [],
        });
        setSubtareas([]);
      }
      setErrors({});
      setNewSubtarea("");
    }
  }, [isOpen, selectedStatus, editTask]);

  // Validar campo individuales
  const validateField = (field, value) => {
    if (field === "titulo") {
      if (!value.trim()) {
        return "El título es requerido";
      }
      if (value.trim().length < 5) {
        return "Mínimo 5 caracteres";
      }
      if (value.trim().length > 20) {
        return "Máximo 20 caracteres";
      }
    }
    if (field === "descripcion" && value.trim()) {
      if (value.trim().length < 10) {
        return "Mínimo 10 caracteres";
      }
      if (value.trim().length > 500) {
        return "Máximo 500 caracteres";
      }
    }
    return null;
  };

  // Validar todo el formulario
  const validateForm = () => {
    const newErrors = {};
    const tituloError = validateField("titulo", formData.titulo);
    const descError = validateField("descripcion", formData.descripcion);
    
    if (tituloError) newErrors.titulo = tituloError;
    if (descError) newErrors.descripcion = descError;
    if (!formData.estado) newErrors.estado = "El estado es requerido";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Validar en tiempo real
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const toggleEtiqueta = (etiquetaId) => {
    setFormData(prev => {
      const current = prev.etiquetas || [];
      const id = String(etiquetaId);
      if (current.includes(id)) {
        return { ...prev, etiquetas: current.filter(e => e !== id) };
      } else {
        return { ...prev, etiquetas: [...current, id] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editTask && onUpdate) {
      // Modo edición
      setUpdating(true);
      try {
        await onUpdate(editTask.id, formData, subtareas);
        toast.success("Tarea actualizada");
        onClose();
      } catch (err) {
        toast.error(err.message || "Error al actualizar tarea");
      } finally {
        setUpdating(false);
      }
    } else {
      // Modo creación - pasar también las subtareas temporales
      onSubmit(formData, subtareas);
    }
  };

  const handleCreateEtiqueta = async () => {
    const nombre = newEtiqueta.nombre.trim();
    setEtiquetaError("");
    
    if (!nombre) {
      setEtiquetaError("El nombre de la etiqueta es requerido");
      return;
    }

    if (nombre.length < 5) {
      setEtiquetaError("El nombre debe tener al menos 5 caracteres");
      return;
    }

    try {
      setCreatingEtiqueta(true);
      const token = getToken();
      const response = await fetch("/api/etiquetas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          nombre: nombre,
          color: newEtiqueta.color,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.nombre?.[0] || data.detail || "Error al crear etiqueta";
        throw new Error(errorMsg);
      }

      setFormData(prev => ({ ...prev, etiquetas: [...(prev.etiquetas || []), String(data.id)] }));
      setShowEtiquetaModal(false);
      setNewEtiqueta({ nombre: "", color: "#3b82f6" });
      toast.success("Etiqueta creada");
      
      // Notificar al padre para que refresque las etiquetas
      if (onEtiquetaCreated) {
        onEtiquetaCreated(data);
      }
    } catch (err) {
      setEtiquetaError(err.message);
    } finally {
      setCreatingEtiqueta(false);
    }
  };

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEstadoDropdown && !e.target.closest('.estado-dropdown')) {
        setShowEstadoDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEstadoDropdown]);
  const estadoSeleccionado = statuses.find(s => 
    s.id?.toString() === formData.estado || s.backendId?.toString() === formData.estado
  );

  if (!isOpen) return null;

  const modalTitle = editTask ? "Editar Tarea" : "Nueva Tarea";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-5xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{modalTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Título */}
          <Input
            label="Título"
            type="text"
            placeholder="Ej: Terminar el informe"
            value={formData.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            required
            maxLength={20}
            error={errors.titulo}
          />

          {/* Layout de 2 columnas: Izquierda = info principal, Derecha = subtareas + etiquetas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Columna izquierda: Descripción, Estado, Fecha */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Descripción
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Agregar una descripción..."
                    value={formData.descripcion}
                    onChange={(e) => handleChange("descripcion", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-emerald-400 resize-none"
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {formData.descripcion?.length || 0}/500
                  </span>
                </div>
                {errors.descripcion && (
                  <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>
                )}
              </div>

              {/* Estado - siempre editable */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Estado
                </label>
                <div className="relative estado-dropdown">
                    {/* Botón principal que muestra el estado seleccionado */}
                    <button
                      type="button"
                      onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                      className="w-full flex items-center justify-between h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400"
                    >
                      <div className="flex items-center gap-2">
                        {estadoSeleccionado && (
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: estadoSeleccionado.color }}
                          />
                        )}
                        <span className={estadoSeleccionado ? "text-white" : "text-slate-400"}>
                          {estadoSeleccionado?.name || "Seleccionar estado"}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown con opciones */}
                    {showEstadoDropdown && (
                      <div className="absolute z-10 w-full mt-1 py-1 rounded-xl border border-white/10 bg-[#181a20] shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                        {statuses.map((status) => {
                          const isSelected = String(status.backendId || status.id) === String(formData.estado);
                          return (
                            <button
                              key={status.id}
                              type="button"
                              onClick={() => {
                                handleChange("estado", String(status.backendId || status.id));
                                setShowEstadoDropdown(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                                isSelected 
                                  ? "bg-white/10" 
                                  : "hover:bg-white/5"
                              }`}
                            >
                              <span 
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: status.color }}
                              />
                              <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                {status.name}
                              </span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-emerald-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {errors.estado && (
                    <p className="text-red-400 text-xs mt-1">{errors.estado}</p>
                  )}
              </div>

              {/* Rango de fechas */}
              <DateRangePicker
                startDate={formData.fecha_inicio}
                endDate={formData.fecha_fin}
                onStartDateChange={(date) => handleChange("fecha_inicio", date)}
                onEndDateChange={(date) => handleChange("fecha_fin", date)}
              />
            </div>

            {/* Columna derecha: Subtareas y Etiquetas */}
            <div className="space-y-4">
              {/* Subtareas */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Subtareas {editTask && subtareas.length > 0 && (
                    <span className="text-white/50 font-normal text-xs ml-2">
                      ({subtareas.filter(s => s.completada).length}/{subtareas.length} completadas)
                    </span>
                  )}
                </label>
                
                {/* Lista de subtareas con scroll */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {subtareas.map((subtarea, index) => (
                    <div 
                      key={subtarea.id || index} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...subtareas];
                          updated[index].completada = !updated[index].completada;
                          setSubtareas(updated);
                        }}
                        className="text-white/60 hover:text-emerald-400 transition"
                      >
                        {subtarea.completada ? (
                          <CheckSquare size={18} className="text-emerald-400" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${subtarea.completada ? 'line-through text-white/40' : 'text-white'}`}>
                        {subtarea.titulo}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSubtareas(subtareas.filter((_, i) => i !== index));
                        }}
                        className="text-white/40 hover:text-red-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {subtareas.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Sin subtareas todavía
                    </div>
                  )}
                </div>

                {/* Input para nueva subtarea */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtarea}
                    onChange={(e) => setNewSubtarea(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtarea.trim()) {
                        e.preventDefault();
                        setSubtareas([...subtareas, { 
                          titulo: newSubtarea.trim(), 
                          completada: false,
                          id: `temp-${Date.now()}`
                        }]);
                        setNewSubtarea("");
                      }
                    }}
                    placeholder="Agregar subtarea..."
                    className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-white text-sm outline-none focus:border-emerald-400 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubtarea.trim()) {
                        setSubtareas([...subtareas, { 
                          titulo: newSubtarea.trim(), 
                          completada: false,
                          id: `temp-${Date.now()}`
                        }]);
                        setNewSubtarea("");
                      }
                    }}
                    disabled={!newSubtarea.trim()}
                    className="px-3 h-10 rounded-xl bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Etiquetas */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-200">
                  Etiquetas (opcional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map((etiqueta) => {
                    const isSelected = formData.etiquetas?.includes(String(etiqueta.id));
                    return (
                      <button
                        key={etiqueta.id}
                        type="button"
                        onClick={() => toggleEtiqueta(etiqueta.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                          isSelected 
                            ? "ring-2 ring-white" 
                            : "border border-white/10 hover:border-white/30"
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? `${etiqueta.color}30` : "rgba(255,255,255,0.05)",
                          color: etiqueta.color 
                        }}
                      >
                        <Flag size={14} />
                        {etiqueta.nombre}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowEtiquetaModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-dashed border-white/10 text-white/50 hover:text-white/70 hover:border-white/30 transition"
                  >
                    + Nueva
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent border border-white/10 text-slate-400 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || updating}
              className="flex-1"
            >
              {loading || updating 
                ? (editTask ? "Actualizando..." : "Creando...") 
                : (editTask ? "Actualizar" : "Crear tarea")}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal para crear etiqueta */}
      {showEtiquetaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-sm border border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Nueva Etiqueta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newEtiqueta.nombre}
                  onChange={(e) => {
                    setNewEtiqueta({ ...newEtiqueta, nombre: e.target.value });
                    setEtiquetaError("");
                  }}
                  placeholder="Ej: Urgente, Trabajo..."
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400"
                />
              {etiquetaError && (
                <p className="text-red-400 text-sm mt-2">{etiquetaError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {["#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f97316", "#eab308", "#ec4899", "#06b6d4", "#6b7280"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEtiqueta({ ...newEtiqueta, color })}
                      className={`w-8 h-8 rounded-full transition ${
                        newEtiqueta.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1d29]" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEtiquetaModal(false);
                  setNewEtiqueta({ nombre: "", color: "#3b82f6" });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEtiqueta}
                disabled={creatingEtiqueta}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition disabled:opacity-50"
              >
                {creatingEtiqueta ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
