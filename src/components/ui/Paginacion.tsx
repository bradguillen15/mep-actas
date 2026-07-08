"use client";

import { Button } from "./button";

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
      <p className="text-sm text-gray-500">
        {textoRango(pagina, limite, totalRegistros, registrosEnPagina)}
      </p>
      {totalPaginas > 1 && (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-borde text-texto hover:bg-superficie"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 1}
        >
          Anterior
        </Button>
        <span className="px-2 text-sm text-gray-500">
          {pagina} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="border-borde text-texto hover:bg-superficie"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
        >
          Siguiente
        </Button>
      </div>
      )}
    </div>
  );
}
