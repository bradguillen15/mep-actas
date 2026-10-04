"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRegistrarEncabezado } from "@/contextos/EncabezadoShellContext";

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  volverA?: { href: string; etiqueta: string };
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  volverA,
}: EncabezadoPaginaProps) {
  useRegistrarEncabezado(titulo, descripcion);

  if (!volverA && !acciones) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {volverA ? (
        <Link
          href={volverA.href}
          className="inline-flex items-center gap-1 rounded text-sm text-texto-suave outline-none transition-colors duration-150 hover-fino:text-texto focus-visible:ring-2 focus-visible:ring-primario"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {volverA.etiqueta}
        </Link>
      ) : null}
      {acciones && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto">
          {acciones}
        </div>
      )}
    </div>
  );
}
