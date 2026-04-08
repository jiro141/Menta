import { NavLink } from "react-router-dom";
import { KanbanSquare, List, CalendarDays, Archive } from "lucide-react";

const items = [
  { label: "Tablero", icon: KanbanSquare, path: "/app/board" },
  { label: "Lista", icon: List, path: "/app/list" },
  { label: "Calendario", icon: CalendarDays, path: "/app/calendar" },
  { label: "Archivo", icon: Archive, path: "/app/archive" },
];

export default function Sidebar() {
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