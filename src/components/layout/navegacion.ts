import {
  Search,
  FileText,
  BookOpen,
  Users,
  Settings,
  History,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  soloAdmin?: boolean;
}

export interface SeccionNavegacion {
  categoria: string;
  items: ItemNavegacion[];
}

export const secciones: SeccionNavegacion[] = [
  {
    categoria: "Principal",
    items: [
      { href: "/consultar", etiqueta: "Consultar", icono: Search },
      { href: "/actas", etiqueta: "Actas", icono: FileText },
      { href: "/tomos", etiqueta: "Tomos", icono: BookOpen },
      { href: "/auditoria", etiqueta: "Auditoría", icono: History },
    ],
  },
  {
    categoria: "Administración",
    items: [
      { href: "/usuarios", etiqueta: "Usuarios", icono: Users, soloAdmin: true },
      { href: "/configuracion", etiqueta: "Configuración", icono: Settings, soloAdmin: true },
    ],
  },
  {
    categoria: "Soporte",
    items: [{ href: "/ayuda", etiqueta: "Ayuda", icono: CircleHelp }],
  },
];

export function rutaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function tituloDeRuta(pathname: string): string | null {
  for (const seccion of secciones) {
    const item = seccion.items.find((candidato) => rutaActiva(pathname, candidato.href));
    if (item) return item.etiqueta;
  }
  return null;
}
