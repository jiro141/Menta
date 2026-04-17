import { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  LogOut,
  FileText,
  Archive,
  ChevronRight,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { searchAll } from "../../api/search";
import { useSearchStore } from "../../stores/searchStore";
import { useBoardData } from "../../hooks/useBoardData";

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { selectTask } = useSearchStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useBoardData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ tareas: [], estados: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Notifications dropdown state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const progressRef = useRef(null);
  const debounceRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const userInitial = user?.email ? user.email[0].toUpperCase() : "U";

  // Get tasks near expiration (within 3 days)
  const getExpiringTasks = () => {
    if (!data?.tasks) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    return data.tasks.filter(task => {
      if (!task.endDate || task.archived) return false;
      const dueDate = new Date(task.endDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate <= threeDaysFromNow;
    });
  };

  // Get completed and pending tasks for final state
  const getProgressStats = () => {
    if (!data?.tasks || !data?.statuses) return { completed: 0, pending: 0, total: 0 };
    
    const finalState = data.statuses.find(s => s.esFinal);
    if (!finalState) return { completed: 0, pending: 0, total: 0 };

    const completed = data.tasks.filter(t => 
      t.status === String(finalState.id) && !t.archived
    ).length;

    const pending = data.tasks.filter(t => 
      t.status !== String(finalState.id) && !t.archived
    ).length;

    return { completed, pending, total: completed + pending };
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults({ tareas: [], estados: [] });
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAll(searchQuery);
        
        // Adaptar las tareas del backend al formato del frontend
        const adaptedTareas = results.tareas.map(tarea => {
          const estadoId = tarea.estado?.id || tarea.estado;
          // Si no hay fecha_inicio, usar fecha_creacion
          const fechaInicio = tarea.fecha_inicio || tarea.fecha_creacion?.split('T')[0] || null;
          
          return {
            ...tarea,
            title: tarea.titulo,
            description: tarea.descripcion || "",
            status: estadoId ? String(estadoId) : null,
            statusName: tarea.estado?.nombre || null,
            statusColor: tarea.estado?.color || null,
            archived: tarea.archivada || false,
            tags: tarea.etiquetas || [],
            subtasks: tarea.subtareas || [],
            startDate: fechaInicio,
            endDate: tarea.fecha_fin || null,
            dueDate: tarea.fecha_fin || null,
          };
        });
        
        setSearchResults({ tareas: adaptedTareas, estados: results.estados });
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (progressRef.current && !progressRef.current.contains(e.target)) {
        setShowProgress(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery("");
    
    if (type === "tarea") {
      // Select task - this will open modal in AppLayout
      selectTask(item);
    } else if (type === "estado") {
      // Navigate to board with filter
      navigate("/board", { state: { filterStatus: item.id } });
    }
  };

  const handleNotificationClick = (task) => {
    setShowNotifications(false);
    selectTask(task);
  };

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("topbar-search")?.focus();
      }
      if (e.key === "Escape") {
        setShowResults(false);
        document.getElementById("topbar-search")?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const expiringTasks = getExpiringTasks();
  const progressStats = getProgressStats();

  // Vista actual basada en la ruta
  const isActiveView = (path) => location.pathname === path || location.pathname.startsWith(path);
  
  // Solo mostrar botones de vista si estamos en un proyecto
  const isInProject = location.pathname.startsWith('/app/proyecto/');
  const params = useParams();
  const proyectoId = params.proyectoId;
  
  const viewButtons = isInProject && proyectoId ? [
    { label: "Board", icon: LayoutGrid, path: `/app/proyecto/${proyectoId}/board` },
    { label: "Lista", icon: List, path: `/app/proyecto/${proyectoId}/list` },
    { label: "Calendario", icon: CalendarDays, path: `/app/proyecto/${proyectoId}/calendar` },
  ] : [];

  return (
    <header className="h-12 sm:h-14 bg-[#0a0a0d] border-b border-white/10 px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
            M
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white hidden sm:inline">Menta</span>
        </div>

        {/* Vista buttons en el navbar */}
        <div className="hidden sm:flex items-center gap-1 ml-4">
          {viewButtons.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${isActiveView(path) 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"}
              `}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search with dropdown */}
      <div className="hidden sm:flex flex-1 max-w-xl relative" ref={searchRef}>
        <div className="h-10 rounded-full bg-white/10 border border-white/10 px-4 flex items-center gap-3 text-white/60 w-full">
          <Search size={18} className={isSearching ? "animate-spin" : ""} />
          <input
            id="topbar-search"
            type="text"
            placeholder="Buscar tareas o estados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
          />
          <span className="text-xs text-white/40">Ctrl K</span>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchResults.tareas.length > 0 || searchResults.estados.length > 0) && (
          <div className="absolute top-full mt-2 w-full max-w-xl bg-[#1a1d29] border border-white/10 rounded-2xl shadow-lg max-h-96 overflow-y-auto z-50">
            {searchResults.estados.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-white/50 px-3 py-1">Estados</p>
                {searchResults.estados.map((estado) => (
                  <button
                    key={estado.id}
                    onClick={() => handleResultClick("estado", estado)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: estado.color }}
                    />
                    <span className="text-white text-sm">{estado.nombre}</span>
                  </button>
                ))}
              </div>
            )}
            
            {searchResults.tareas.length > 0 && (
              <div className="p-2 border-t border-white/10">
                <p className="text-xs text-white/50 px-3 py-1">Tareas</p>
                {searchResults.tareas.map((tarea) => (
                  <button
                    key={tarea.id}
                    onClick={() => handleResultClick("tarea", tarea)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition text-left"
                  >
                    {tarea.archived ? (
                      <Archive size={16} className="text-amber-400" />
                    ) : (
                      <FileText size={16} className="text-white/60" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{tarea.title}</p>
                      {tarea.description && (
                        <p className="text-white/50 text-xs truncate">{tarea.description}</p>
                      )}
                    </div>
                    {tarea.estado && (
                      <span
                        className="text-xs px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: tarea.estado.color || "#6b7280" }}
                      >
                        {tarea.estado.nombre}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No results message */}
        {showResults && searchQuery && searchResults.tareas.length === 0 && searchResults.estados.length === 0 && !isSearching && (
          <div className="absolute top-full mt-2 w-full max-w-xl bg-[#1a1d29] border border-white/10 rounded-2xl shadow-lg p-4 z-50">
            <p className="text-white/60 text-sm text-center">No se encontraron resultados</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProgress(false);
            }}
            className={`w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center transition relative ${
              expiringTasks.length > 0 ? "text-amber-400" : "text-white/80"
            }`}
          >
            <Bell size={18} />
            {expiringTasks.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full mt-2 right-0 w-80 bg-[#1a1d29] border border-white/10 rounded-2xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-white/10">
                <h3 className="text-white font-semibold">Notificaciones</h3>
                <p className="text-white/50 text-xs">Tareas por vencer en los próximos 3 días</p>
              </div>
              
              {expiringTasks.length === 0 ? (
                <div className="p-4 text-center text-white/60">
                  <p>No hay tareas por vencer</p>
                </div>
              ) : (
                <div className="p-2">
                  {expiringTasks.map(task => {
                    const daysLeft = Math.ceil((new Date(task.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleNotificationClick(task)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition text-left"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{task.title}</p>
                          <p className="text-white/50 text-xs">
                            {daysLeft === 0 ? "Vence hoy" : daysLeft === 1 ? "Vence mañana" : `Vence en ${daysLeft} días`}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-white/40" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress/Archive Icon */}
        <div className="relative" ref={progressRef}>
          <button
            onClick={() => {
              setShowProgress(!showProgress);
              setShowNotifications(false);
            }}
            className="w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/80 transition"
          >
            <Archive size={18} />
          </button>
          
          {/* Progress Dropdown */}
          {showProgress && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-[#1a1d29] border border-white/10 rounded-2xl shadow-lg z-50 p-4">
              <h3 className="text-white font-semibold mb-3">Progreso</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Completadas</span>
                  <span className="text-emerald-400 font-bold">{progressStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Pendientes</span>
                  <span className="text-amber-400 font-bold">{progressStats.pending}</span>
                </div>
                
                {/* Progress bar */}
                {progressStats.total > 0 && (
                  <div className="mt-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(progressStats.completed / progressStats.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-white/50 text-xs mt-1 text-center">
                      {Math.round((progressStats.completed / progressStats.total) * 100)}% completado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className="ml-1 sm:ml-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition"
          title="Cerrar sesión"
        >
          <LogOut size={16} sm={18} />
        </button>
      </div>
    </header>
  );
}
