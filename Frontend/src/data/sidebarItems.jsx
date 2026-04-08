import {
  House,
  CalendarDays,
  Sparkles,
  Users,
  FileText,
  LayoutDashboard,
  Clipboard,
  PenSquare,
  Goal,
} from "lucide-react";

export const sidebarItems = [
  { label: "Home", icon: House, path: "/app" },
  { label: "Planner", icon: CalendarDays, path: "/app/planner" },
  { label: "AI", icon: Sparkles, path: "/app/ai" },
  { label: "Teams", icon: Users, path: "/app/teams" },
  { label: "Docs", icon: FileText, path: "/app/docs" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/app/dashboard" },
  { label: "Whiteboard", icon: PenSquare, path: "/app/whiteboard" },
  { label: "Forms", icon: Clipboard, path: "/app/forms" },
  { label: "Goals", icon: Goal, path: "/app/goals" },
];