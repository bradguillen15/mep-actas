"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { BotonIcono } from "../ui/BotonIcono";
import { tituloDeRuta } from "./navegacion";

interface HeaderProps {
  menuAbierto: boolean;
  onAbrirMenu: () => void;
}

export function Header({ menuAbierto, onAbrirMenu }: HeaderProps) {
  const titulo = tituloDeRuta(usePathname());

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-borde bg-white/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <BotonIcono
          etiqueta="Abrir menú"
          icono={<Menu aria-hidden="true" />}
          onClick={onAbrirMenu}
          aria-expanded={menuAbierto}
          aria-controls="cajon-navegacion"
          className="size-10 md:hidden"
        />
        {titulo && (
          <p data-testid="titulo-seccion" className="hidden truncate text-sm font-semibold text-texto sm:block">
            {titulo}
          </p>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mep.svg"
        alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
        className="h-7 w-auto shrink-0 md:h-8"
      />
    </header>
  );
}
