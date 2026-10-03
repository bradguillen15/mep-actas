"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  LIMITE_PAGINA_POR_DEFECTO,
  OPCIONES_LIMITE_PAGINA,
} from "@/lib/paginacion";
import { Boton } from "./Boton";
import { Selector } from "./Selector";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  limite: number;
  registrosEnPagina: number;
  onChange: (pagina: number) => void;
  onLimiteChange?: (limite: number) => void;
  opcionesLimite?: readonly number[];
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
  onLimiteChange,
  opcionesLimite = OPCIONES_LIMITE_PAGINA,
}: PaginacionProps) {
  if (totalRegistros === 0) return null;

  const limites =
    opcionesLimite.includes(limite) || limite === LIMITE_PAGINA_POR_DEFECTO
      ? opcionesLimite
      : [...opcionesLimite, limite].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-3 border-t border-borde px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
      <p className="text-xs text-texto-suave sm:text-sm">
        {textoRango(pagina, limite, totalRegistros, registrosEnPagina)}
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onLimiteChange && (
          <div className="flex items-center gap-2 text-xs text-texto-suave sm:text-sm">
            <span className="whitespace-nowrap">Por página</span>
            <Selector
              id="limite-pagina"
              aria-label="Registros por página"
              value={String(limite)}
              onChange={(evento) => onLimiteChange(Number(evento.target.value))}
              opciones={limites.map((opcion) => ({
                valor: String(opcion),
                etiqueta: String(opcion),
              }))}
              className="h-9 w-auto min-w-20"
            />
          </div>
        )}
        {totalPaginas > 1 && (
          <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none">
            <Boton
              variante="secundario"
              tamano="sm"
              aria-label="Página anterior"
              onClick={() => onChange(pagina - 1)}
              disabled={pagina <= 1}
            >
              <ChevronLeft aria-hidden />
              <span className="hidden sm:inline">Anterior</span>
            </Boton>
            <span className="px-1 text-xs tabular-nums text-texto-suave sm:px-2 sm:text-sm">
              {pagina} de {totalPaginas}
            </span>
            <Boton
              variante="secundario"
              tamano="sm"
              aria-label="Página siguiente"
              onClick={() => onChange(pagina + 1)}
              disabled={pagina >= totalPaginas}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight aria-hidden />
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}
