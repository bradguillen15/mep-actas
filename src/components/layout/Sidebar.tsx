"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  FileText,
  BookOpen,
  Users,
  Settings,
  History,
  LogOut,
  User,
} from "lucide-react";
import { useSesion } from "@/hooks/useSesion";

interface NavItem {
  href: string;
  etiqueta: string;
  icono: typeof Search;
  adminOnly?: boolean;
}

interface NavSeccion {
  categoria: string;
  items: NavItem[];
}

const secciones: NavSeccion[] = [
  {
    categoria: "Principal",
    items: [
      { href: "/consultar", etiqueta: "Consultar", icono: Search },
      { href: "/actas", etiqueta: "Actas", icono: FileText },
      { href: "/tomos", etiqueta: "Tomos", icono: BookOpen },
    ],
  },
  {
    categoria: "Administración",
    items: [
      { href: "/usuarios", etiqueta: "Usuarios", icono: Users, adminOnly: true },
      { href: "/configuracion", etiqueta: "Configuración", icono: Settings, adminOnly: true },
      { href: "/auditoria", etiqueta: "Auditoría", icono: History, adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useSesion();

  if (!usuario) return null;

  const esAdmin = usuario.nivel <= 3;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-primario-hover bg-primario text-white">
      <div className="flex items-center gap-3 px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt="Escudo del Ministerio de Educación Pública"
          className="h-10 w-10 rounded-lg ring-1 ring-white/20"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">SCT</span>
          <span className="text-[10px] text-white/60">Consulta de Títulos</span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
        {secciones.map((seccion) => {
          const itemsVisibles = seccion.items.filter(
            (item) => !item.adminOnly || esAdmin
          );
          if (itemsVisibles.length === 0) return null;

          return (
            <div key={seccion.categoria}>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                {seccion.categoria}
              </h3>
              <div className="space-y-1">
                {itemsVisibles.map((item) => {
                  const Icono = item.icono;
                  const activo = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        activo
                          ? "bg-acento text-primario shadow-md"
                          : "text-white hover:bg-white/10 hover:shadow-md"
                      }`}
                    >
                      <Icono className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      {item.etiqueta}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-primario-hover px-2 py-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70">
          <User className="h-4 w-4" />
          <span className="truncate">{usuario.nombre}</span>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
