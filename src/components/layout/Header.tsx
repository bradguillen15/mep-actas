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
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-3 border-b-2 border-acento bg-primario px-4 py-3 text-white sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <BotonIcono
          etiqueta="Abrir menú"
          icono={<Menu aria-hidden="true" />}
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="cajon-navegacion"
          className="size-10 shrink-0 text-white/75 hover-fino:bg-white/5 hover-fino:text-white focus-visible:ring-acento/60 focus-visible:ring-offset-0 md:hidden"
        />
        {titulo && (
          <div className="flex min-w-0 flex-col gap-0">
            <h1
              data-testid="titulo-seccion"
              className="truncate text-base font-semibold tracking-tight leading-tight text-white"
            >
              {titulo}
            </h1>
            {descripcion && (
              <p className="hidden text-xs leading-tight text-white/70 sm:line-clamp-1 sm:block sm:truncate">
                {descripcion}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
