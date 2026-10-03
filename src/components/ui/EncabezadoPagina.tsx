import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {volverA && (
          <Link
            href={volverA.href}
            className="mb-2 inline-flex items-center gap-1 rounded text-sm text-texto-suave outline-none transition-colors duration-150 hover-fino:text-texto focus-visible:ring-2 focus-visible:ring-primario"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {volverA.etiqueta}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-texto">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
        )}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </div>
  );
}
