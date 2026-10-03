"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Boton } from "./Boton";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
  registrosEnPagina: number;
  onChange: (pagina: number) => void;
}

function textoRango(
  pagina: number,
  limite: number,
  totalRegistros: number,
  registrosEnPagina: number
): string {
  if (totalRegistros === 0) {
    return "Sin registros";
  }

  const inicio = (pagina - 1) * limite + 1;
  const fin = inicio + registrosEnPagina - 1;

  return `Mostrando ${inicio}–${fin} de ${totalRegistros} registro${
    totalRegistros !== 1 ? "s" : ""
  }`;
}

export function Paginacion({
  pagina,
  totalPaginas,
  totalRegistros,
  limite,
  registrosEnPagina,
  onChange,
}: PaginacionProps) {
  if (totalRegistros === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-borde px-4 py-3">
      <p className="text-sm text-texto-suave">
        {textoRango(pagina, limite, totalRegistros, registrosEnPagina)}
      </p>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <Boton
            variante="secundario"
            tamano="sm"
            aria-label="Página anterior"
            onClick={() => onChange(pagina - 1)}
            disabled={pagina <= 1}
          >
            <ChevronLeft aria-hidden />
            Anterior
          </Boton>
          <span className="px-2 text-sm tabular-nums text-texto-suave">
            {pagina} de {totalPaginas}
          </span>
          <Boton
            variante="secundario"
            tamano="sm"
            aria-label="Página siguiente"
            onClick={() => onChange(pagina + 1)}
            disabled={pagina >= totalPaginas}
          >
            Siguiente
            <ChevronRight aria-hidden />
          </Boton>
        </div>
      )}
    </div>
  );
}
