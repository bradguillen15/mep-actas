"use client";

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
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina <= 1}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto hover:bg-superficie disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <span className="px-2 text-sm text-gray-500">
          {pagina} de {totalPaginas}
        </span>
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto hover:bg-superficie disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
