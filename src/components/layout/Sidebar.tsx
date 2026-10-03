"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSesion } from "@/hooks/useSesion";
import { cn } from "@/lib/utils";
import { Esqueleto } from "../ui/Esqueleto";
import { secciones, rutaActiva } from "./navegacion";

const ETIQUETA_ROL: Record<number, string> = {
  1: "Admin País",
  2: "Admin Regional",
  3: "Admin Escuela",
  4: "Staff",
};

const ANILLO_FOCO =
  "outline-none focus-visible:ring-2 focus-visible:ring-acento/60 focus-visible:ring-offset-0";

function obtenerIniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "");
  return letras.join("") || "?";
}

interface SidebarProps {
  onNavegar?: () => void;
  accionCabecera?: ReactNode;
}

function Marca({ onNavegar, accionCabecera }: SidebarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-5">
      <Link
        href="/consultar"
        onClick={onNavegar}
        className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-lg", ANILLO_FOCO)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.svg"
          alt=""
          className="size-10 shrink-0 rounded-lg ring-1 ring-white/20"
        />
        <span className="text-balance text-sm font-semibold leading-snug">
          Sistema de Consulta de Títulos
        </span>
      </Link>
      {accionCabecera}
    </div>
  );
}

function EsqueletoSidebar() {
  return (
    <div aria-hidden="true" className="flex-1 space-y-6 px-3 py-5">
      {[3, 3, 1].map((cantidad, seccion) => (
        <div key={seccion} className="space-y-2">
          <Esqueleto className="h-3 w-20 bg-white/10" />
          {Array.from({ length: cantidad }, (_, item) => (
            <Esqueleto key={item} className="h-9 w-full bg-white/10" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ onNavegar, accionCabecera }: SidebarProps) {
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useSesion();

  const esAdmin = usuario ? usuario.nivel <= 3 : false;

  return (
    <aside className="flex h-dvh w-full flex-col border-r border-primario-hover bg-primario text-white">
      <Marca onNavegar={onNavegar} accionCabecera={accionCabecera} />

      {!usuario ? (
        <EsqueletoSidebar />
      ) : (
        <nav aria-label="Principal" className="flex-1 space-y-6 overflow-y-auto px-2 py-5">
          {secciones.map((seccion) => {
            const itemsVisibles = seccion.items.filter((item) => !item.soloAdmin || esAdmin);
            if (itemsVisibles.length === 0) return null;

            return (
              <div key={seccion.categoria} className="space-y-1">
                <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  {seccion.categoria}
                </h3>
                {itemsVisibles.map((item) => {
                  const Icono = item.icono;
                  const activo = rutaActiva(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavegar}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98]",
                        ANILLO_FOCO,
                        activo
                          ? "bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-acento"
                          : "text-white/75 hover-fino:bg-white/5 hover-fino:text-white"
                      )}
                    >
                      <Icono
                        className={cn("size-5 shrink-0", activo && "text-acento")}
                        aria-hidden="true"
                      />
                      {item.etiqueta}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      )}

      <div className="border-t border-white/10 p-2">
        {usuario ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-acento"
              >
                {obtenerIniciales(usuario.nombre)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={usuario.nombre}>
                  {usuario.nombre}
                </p>
                <p className="truncate text-xs text-white/60">
                  {ETIQUETA_ROL[usuario.nivel] ?? `Nivel ${usuario.nivel}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 transition-[background-color,color,transform] duration-150 ease-out hover-fino:bg-white/5 hover-fino:text-white active:scale-[0.98]",
                ANILLO_FOCO
              )}
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Cerrar sesión
            </button>
          </>
        ) : (
          <div aria-hidden="true" className="flex items-center gap-3 px-3 py-2">
            <Esqueleto className="size-8 shrink-0 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Esqueleto className="h-3 w-24 bg-white/10" />
              <Esqueleto className="h-3 w-16 bg-white/10" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
