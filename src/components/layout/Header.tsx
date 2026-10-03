"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEncabezadoShell } from "@/contextos/EncabezadoShellContext";
import { BotonIcono } from "../ui/BotonIcono";
import { tituloDeRuta } from "./navegacion";

interface HeaderProps {
  menuAbierto: boolean;
  onAbrirMenu: () => void;
}

export function Header({ menuAbierto, onAbrirMenu }: HeaderProps) {
  const pathname = usePathname();
  const { encabezado } = useEncabezadoShell();
  const titulo = encabezado.titulo ?? tituloDeRuta(pathname);
  const descripcion = encabezado.descripcion;

  return (
    <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-borde bg-white/80 px-4 pt-8 pb-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:px-6 sm:pt-6 sm:pb-3 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <BotonIcono
          etiqueta="Abrir menú"
          icono={<Menu aria-hidden="true" />}
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="cajon-navegacion"
          className="size-10 shrink-0 md:hidden"
        />
        {titulo && (
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1
              data-testid="titulo-seccion"
              className="truncate text-lg font-semibold tracking-tight leading-snug text-texto"
            >
              {titulo}
            </h1>
            {descripcion && (
              <p className="hidden text-xs leading-snug text-texto-suave sm:line-clamp-1 sm:block sm:truncate">
                {descripcion}
              </p>
            )}
          </div>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mep.svg"
        alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
        className="hidden h-7 w-auto shrink-0 sm:block md:h-8"
      />
    </header>
  );
}
