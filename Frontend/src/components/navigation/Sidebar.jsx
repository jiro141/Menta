import { NavLink, useLocation, useParams } from "react-router-dom";
import { useEquipoStore } from "../../stores/equipoStore";
import { FolderKanban } from "lucide-react";
import { 
  Folder, Code, Palette, ShoppingCart, BarChart3, Settings, 
  Users, MessageSquare, Calendar as CalendarMail, Mail, FileText, Briefcase, 
  Heart, Star, Zap, Target, Trophy, Rocket 
} from "lucide-react";

const ICONOS = {
  folder: Folder,
  code: Code,
  palette: Palette,
  "shopping-cart": ShoppingCart,
  "bar-chart": BarChart3,
  settings: Settings,
  users: Users,
  "message-square": MessageSquare,
  calendar: CalendarMail,
  mail: Mail,
  "file-text": FileText,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  zap: Zap,
  target: Target,
  trophy: Trophy,
  rocket: Rocket,
};

export default function Sidebar() {
  const location = useLocation();
  const params = useParams();
  const { equipoActual, proyectos } = useEquipoStore();

  const items = [
    { label: "Equipos", icon: FolderKanban, path: "/app/equipos" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[88px] bg-[#0b1220] border-r border-white/10 flex-col items-center py-4 fixed left-0 top-0 h-screen z-40">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md">
            <div className="w-6 h-6 rounded-full bg-[#0b1220] flex items-center justify-center text-white text-[10px] font-bold">
              m
            </div>
          </div>
        </div>

        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {items.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                [
                  "w-full flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition-all",
                  isActive
                    ? "bg-[#10203e] text-white"
                    : "text-[#c9d2e3] hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <Icon size={20} strokeWidth={2.1} />
              </div>

              <span className="text-[11px] font-medium leading-none text-center">
                {label}
              </span>
            </NavLink>
          ))}

          {/* Proyectos del equipo actual */}
          {equipoActual && proyectos.map((proyecto) => {
            const IconComponent = ICONOS[proyecto.icono] || Folder;
            const isActive = location.pathname.startsWith(`/app/proyecto/${proyecto.id}`);
            return (
              <NavLink
                key={proyecto.id}
                to={`/app/proyecto/${proyecto.id}/board`}
                className={[
                  "w-full flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all",
                  isActive
                    ? "bg-[#10203e] text-white"
                    : "text-[#c9d2e3] hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: proyecto.color || "#6366f1" }}
                >
                  <IconComponent size={16} className="text-white" />
                </div>
                <span className="text-[9px] font-medium leading-none text-center truncate w-full px-1">
                  {proyecto.nombre}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b1220] border-t border-white/10 flex justify-around py-2 z-40">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive
                  ? "text-white"
                  : "text-[#c9d2e3]",
              ].join(" ")
            }
          >
            <Icon size={20} strokeWidth={2.1} />
            <span className="text-[10px] font-medium">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}