import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEquipoStore } from "../stores/equipoStore";
import { searchUsers, addMiembro, getMiembros } from "../api/equipos";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { 
  Plus, 
  FolderKanban,
  Folder, 
  Code, 
  Palette, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users, 
  MessageSquare, 
  Calendar, 
  Mail, 
  FileText, 
  Briefcase, 
  Heart, 
  Star, 
  Zap, 
  Target, 
  Trophy, 
  Rocket
} from "lucide-react";

const ICONOS = [
  { name: "folder", icon: Folder },
  { name: "code", icon: Code },
  { name: "palette", icon: Palette },
  { name: "shopping-cart", icon: ShoppingCart },
  { name: "bar-chart", icon: BarChart3 },
  { name: "settings", icon: Settings },
  { name: "users", icon: Users },
  { name: "message-square", icon: MessageSquare },
  { name: "calendar", icon: Calendar },
  { name: "mail", icon: Mail },
  { name: "file-text", icon: FileText },
  { name: "briefcase", icon: Briefcase },
  { name: "heart", icon: Heart },
  { name: "star", icon: Star },
  { name: "zap", icon: Zap },
  { name: "target", icon: Target },
  { name: "trophy", icon: Trophy },
  { name: "rocket", icon: Rocket },
];

const COLORES_PROYECTO = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function EquiposPage() {
  const navigate = useNavigate();
  const { 
    equipos, 
    equipoActual, 
    proyectos,
    miembros,
    fetchEquipos, 
    selectEquipo, 
    createEquipo,
    fetchProyectos,
    fetchMiembros,
    createProyecto,
    isLoading,
    error 
  } = useEquipoStore();

  const [showInvitar, setShowInvitar] = useState(false);
  const [showNewEquipo, setShowNewEquipo] = useState(false);
  const [showNewProyecto, setShowNewProyecto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState("DEV");
  const hasFetchedEquipos = useRef(false);

  // Estado para el modal de crear equipo
  const [newEquipoNombre, setNewEquipoNombre] = useState("");
  const [newProyectoNombre, setNewProyectoNombre] = useState("");
  const [newProyectoIcono, setNewProyectoIcono] = useState("folder");
  const [newProyectoColor, setNewProyectoColor] = useState("#6366f1");

  useEffect(() => {
    if (!hasFetchedEquipos.current) {
      hasFetchedEquipos.current = true;
      fetchEquipos();
    }
  }, []);

  useEffect(() => {
    if (equipoActual) {
      fetchProyectos(equipoActual.id);
      fetchMiembros(equipoActual.id);
    }
  }, [equipoActual?.id]);

  // Buscar usuarios cuando escribe
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (busqueda.length >= 3 && equipoActual) {
        setLoadingBusqueda(true);
        try {
          const result = await searchUsers(busqueda);
          setUsuariosEncontrados(result.usuarios || []);
        } catch (e) {
          console.error(e);
        }
        setLoadingBusqueda(false);
      } else {
        setUsuariosEncontrados([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleCreateEquipo = async (e) => {
    e.preventDefault();
    if (!newEquipoNombre.trim()) return;
    
    try {
      await createEquipo({ 
        nombre: newEquipoNombre,
        descripcion: "",
        color: "#6366f1"
      });
      
      toast.success("Equipo creado");
      setNewEquipoNombre("");
      setShowNewEquipo(false);
    } catch (err) {
      toast.error(err.message || "Error al crear equipo");
    }
  };

  const handleCreateProyecto = async (e) => {
    e.preventDefault();
    if (!newProyectoNombre.trim() || !equipoActual) return;
    
    try {
      await createProyecto(equipoActual.id, {
        nombre: newProyectoNombre,
        descripcion: "",
        color: newProyectoColor,
        icono: newProyectoIcono
      });
      
      toast.success("Proyecto creado");
      setNewProyectoNombre("");
      setNewProyectoIcono("folder");
      setNewProyectoColor("#6366f1");
      setShowNewProyecto(false);
    } catch (err) {
      toast.error(err.message || "Error al crear proyecto");
    }
  };

  const handleInvitar = async (usuarioId) => {
    if (!equipoActual) return;
    
    try {
      await addMiembro(equipoActual.id, usuarioId, rolSeleccionado);
      // Recargar miembros
      await fetchMiembros(equipoActual.id);
      setBusqueda("");
      setUsuariosEncontrados([]);
    } catch (e) {
      console.error(e);
    }
  };

return (
    <div className="p-6 max-w-6xl mx-auto min-h-full bg-[#06080d]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Equipos</h1>
      </div>

      {/* Estado vacío: usuario sin equipos */}
      {equipos.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
            <FolderKanban size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Bienvenido a Menta</h2>
          <p className="text-slate-400 text-center max-w-md mb-6">
            Crea tu primer equipo para comenzar a gestionar tus proyectos y tareas con tu equipo.
          </p>
          <button
            onClick={() => {
              setNewEquipoNombre("");
              setShowNewEquipo(true);
            }}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition flex items-center gap-2"
          >
            <Plus size={20} />
            Crear mi primer equipo
          </button>

          {/* Modal crear primer equipo */}
          {showNewEquipo && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewEquipo(false)}>
              <form onSubmit={handleCreateEquipo} className="bg-[#1a1d29] p-6 rounded-2xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-white">Crear tu primer equipo</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nombre del equipo</label>
                    <input
                      type="text"
                      placeholder="Ej: Mi Equipo"
                      value={newEquipoNombre}
                      onChange={(e) => setNewEquipoNombre(e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewEquipo(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !newEquipoNombre.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Lista de Equipos */}
      {equipos.length > 0 && (
        <>
          {/* Botón floated para crear equipo */}
          <button
            onClick={() => {
              setNewEquipoNombre("");
              setShowNewEquipo(true);
            }}
            className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 z-40"
          >
            <Plus size={20} />
            <span>Nuevo Equipo</span>
          </button>

          {/* Modal crear nuevo equipo (cuando ya hay equipos) */}
          {showNewEquipo && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewEquipo(false)}>
              <form onSubmit={handleCreateEquipo} className="bg-[#1a1d29] p-6 rounded-2xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-white">Crear nuevo equipo</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nombre del equipo</label>
                    <input
                      type="text"
                      placeholder="Ej: Mi Equipo"
                      value={newEquipoNombre}
                      onChange={(e) => setNewEquipoNombre(e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewEquipo(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !newEquipoNombre.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {equipos.map((equipo) => (
                <div
                  key={equipo.id}
                  onClick={() => selectEquipo(equipo.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    equipoActual?.id === equipo.id
                      ? "border-indigo-500 bg-indigo-500/20"
                      : "border-white/10 border-dashed hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: equipo.color || "#6366f1" }}
                    >
                      {equipo.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{equipo.nombre}</h3>
                      <p className="text-sm text-slate-400">
                        {equipo.miembro_count || 1} miembro{(equipo.miembro_count || 1) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {/* Proyectos del Equipo Actual */}
      {equipoActual && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Proyectos de {equipoActual.nombre}
            </h2>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setBusqueda("");
                  setUsuariosEncontrados([]);
                  setShowInvitar(true);
                }}
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium text-sm transition flex items-center gap-2"
              >
                <Plus size={18} />
                Invitar
              </button>
              <button 
                onClick={() => setShowNewProyecto(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition flex items-center gap-2"
              >
                <Plus size={18} />
                Nuevo Proyecto
              </button>
            </div>
          </div>

          {/* Modal de invitar miembros */}
          {showInvitar && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInvitar(false)}>
              <div className="bg-[#1a1d29] rounded-2xl p-4 sm:p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-white">Invitar miembro al equipo</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Buscar por email</label>
                    <input
                      type="text"
                      placeholder="Escribe al menos 3 caracteres..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Rol</label>
                    <div className="relative">
                      <select 
                        value={rolSeleccionado}
                        onChange={(e) => setRolSeleccionado(e.target.value)}
                        className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400 appearance-none cursor-pointer"
                      >
                        <option value="DEV" className="bg-[#1a1d29]">Desarrollador</option>
                        <option value="ADMIN" className="bg-[#1a1d29]">Administrador</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {loadingBusqueda && (
                    <p className="text-sm text-slate-400">Buscando...</p>
                  )}

                  {usuariosEncontrados.length > 0 && (
                    <div className="space-y-3">
                      {usuariosEncontrados.map((usuario) => (
                        <div 
                          key={usuario.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <span className="text-white">{usuario.email}</span>
                          <button 
                            onClick={() => handleInvitar(usuario.id)}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition"
                          >
                            Invitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {busqueda.length >= 3 && !loadingBusqueda && usuariosEncontrados.length === 0 && (
                    <p className="text-sm text-slate-400">No se encontraron usuarios</p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInvitar(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          

          {/* Miembros del equipo */}
          {miembros.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3">Miembros del equipo</h3>
              <div className="flex flex-wrap gap-2">
                {miembros.map((miembro) => (
                  <div 
                    key={miembro.id}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-sm"
                  >
                    <span className="text-white">{miembro.usuario?.email}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      miembro.rol === 'ADMIN' 
                        ? 'bg-indigo-500/30 text-indigo-300' 
                        : 'bg-white/10 text-slate-300'
                    }`}>
                      {miembro.rol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          

          {/* Formulario nuevo proyecto - MODAL */}
          {showNewProyecto && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewProyecto(false)}>
              <form onSubmit={handleCreateProyecto} className="bg-[#1a1d29] p-6 rounded-2xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-white">Crear nuevo proyecto</h3>
                
                <div className="space-y-4">
                  {/* Nombre del proyecto */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: Mi Proyecto"
                      value={newProyectoNombre}
                      onChange={(e) => setNewProyectoNombre(e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-emerald-400 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Selector de icono */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Icono</label>
                    <div className="grid grid-cols-6 gap-2">
                      {ICONOS.map((iconObj) => {
                        const IconComponent = iconObj.icon;
                        const isSelected = newProyectoIcono === iconObj.name;
                        return (
                          <button
                            key={iconObj.name}
                            type="button"
                            onClick={() => setNewProyectoIcono(iconObj.name)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                              isSelected 
                                ? "bg-emerald-500/20 ring-2 ring-emerald-500" 
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <IconComponent size={20} className={isSelected ? "text-emerald-400" : "text-slate-400"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de color */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Color</label>
                    <div className="flex gap-2">
                      {COLORES_PROYECTO.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewProyectoColor(color)}
                          className={`w-8 h-8 rounded-full transition ${
                            newProyectoColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1d29]" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewProyecto(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProyecto}
                    disabled={isLoading || !newProyectoNombre.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Proyectos - Estilo sutil */}
          {proyectos.length === 0 ? (
            <button
              onClick={() => setShowNewProyecto(true)}
              className="w-full py-12 border-2 border-dashed border-white/10 rounded-xl hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-emerald-400">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Nuevo Proyecto</span>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {proyectos.map((proyecto) => (
                <div
                  key={proyecto.id}
                  onClick={() => navigate(`/app/proyecto/${proyecto.id}`)}
                  className="p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: proyecto.color || "#6366f1" }}
                    >
                      {(() => {
                        const iconObj = ICONOS.find(i => i.name === (proyecto.icono || "folder"));
                        const IconComponent = iconObj ? iconObj.icon : Folder;
                        return <IconComponent size={20} className="text-white" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{proyecto.nombre}</h4>
                      <p className="text-xs text-slate-400">
                        Click para abrir
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Botón sutil para nuevo proyecto */}
              <button
                onClick={() => setShowNewProyecto(true)}
                className="p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-emerald-400">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Nuevo Proyecto</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}