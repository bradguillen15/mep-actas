"use client";

import { Button } from "./button";

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  onChange: (pagina: number) => void;
}

export function Paginacion({
  pagina,
  totalPaginas,
  totalRegistros,
  onChange,
}: PaginacionProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-borde px-4 py-3">
      <p className="text-sm text-gray-500">
        {totalRegistros} registro{totalRegistros !== 1 ? "s" : ""} en total
      </p>
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
    </div>
  );
}
