import {
  FolderKanban,
  LayoutGrid,
  List,
  Calendar,
  Archive,
  Folder,
  MessageSquare,
} from "lucide-react";

export const sidebarItems = [
  { label: "Equipos", icon: FolderKanban, path: "/app/equipos" },
  { label: "Proyecto", icon: Folder, path: "/app/proyecto" },
  { label: "Board", icon: LayoutGrid, path: "/app/board" },
  { label: "Lista", icon: List, path: "/app/list" },
  { label: "Calendario", icon: Calendar, path: "/app/calendar" },
  { label: "Archivados", icon: Archive, path: "/app/archive" },
];