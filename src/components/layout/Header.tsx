"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onAbrirMenu?: () => void;
}

export function Header({ onAbrirMenu }: HeaderProps) {
  return (
    <header className="relative flex h-16 flex-shrink-0 items-center justify-center border-b border-borde bg-white px-4 sm:px-6">
      {onAbrirMenu && (
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menú de navegación"
          className="absolute left-4 rounded-lg p-2 text-texto transition-colors hover:bg-superficie md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mep.svg"
        alt="Ministerio de Educación Pública — Gobierno de Costa Rica"
        className="h-8 w-auto"
      />
    </header>
  );
}
