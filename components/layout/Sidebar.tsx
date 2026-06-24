"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  FileText,
  BookOpen,
  Settings,
  ShieldAlert,
  LogOut,
  User,
} from "lucide-react";
import { useSesion } from "@/hooks/useSesion";

interface NavItem {
  href: string;
  etiqueta: string;
  icono: typeof Search;
  adminOnly?: boolean;
  staffVisible?: boolean;
}

const itemsNav: NavItem[] = [
  { href: "/consultar", etiqueta: "Consultar", icono: Search, staffVisible: true },
  { href: "/actas", etiqueta: "Actas", icono: FileText, staffVisible: true },
  { href: "/tomos", etiqueta: "Tomos", icono: BookOpen, staffVisible: true },
  { href: "/configuracion", etiqueta: "Configuración", icono: Settings, adminOnly: true },
  { href: "/auditoria", etiqueta: "Auditoría", icono: ShieldAlert, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useSesion();

  if (!usuario) return null;

  const esAdmin = usuario.nivel <= 3;

  const itemsVisibles = itemsNav.filter(
    (item) =>
      !item.adminOnly || esAdmin
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-primario text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
          <span className="text-lg font-bold text-acento">MEP</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">SCT</span>
          <span className="text-[10px] text-white/60">Consulta de Títulos</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {itemsVisibles.map((item) => {
          const Icono = item.icono;
          const activo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activo
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icono className="h-5 w-5" />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70">
          <User className="h-4 w-4" />
          <span className="truncate">{usuario.nombre}</span>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
