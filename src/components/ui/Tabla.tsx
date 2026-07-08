"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Paginacion } from "./Paginacion";

const ALTURA_FILA = 53;

interface TablaProps<T> {
  columnas: ColumnDef<T>[];
  datos: T[];
  onFilaClick?: (fila: T) => void;
  paginacion?: boolean;
  virtualizada?: boolean;
  className?: string;
}

export function Tabla<T>({
  columnas,
  datos,
  onFilaClick,
  paginacion = true,
  virtualizada = false,
  className = "",
}: TablaProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const usarPaginacion = paginacion && !virtualizada;

  // eslint-disable-next-line react-hooks/incompatible-library
  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: usarPaginacion ? getPaginationRowModel() : undefined,
    initialState: { pagination: { pageSize: 20 } },
  });

  const filas = tabla.getRowModel().rows;
  const cantidadColumnas = tabla.getAllColumns().length;

  const virtualizer = useVirtualizer({
    count: virtualizada ? filas.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ALTURA_FILA,
    overscan: 8,
  });

  const filasVirtuales = virtualizer.getVirtualItems();

  const clasesFilaInteractiva = onFilaClick
    ? "cursor-pointer transition-colors hover:!bg-primario/10 active:!bg-primario/15"
    : "";

  const encabezado = (
    <TableHeader className="sticky top-0 z-10 bg-primario shadow-[0_1px_0_0_var(--color-primario-hover)]">
      {tabla.getHeaderGroups().map((grupo) => (
        <TableRow key={grupo.id} className="border-primario-hover bg-primario hover:bg-primario">
          {grupo.headers.map((header) => (
            <TableHead
              key={header.id}
              className={cn(
                "bg-primario text-xs font-semibold uppercase tracking-wider text-white/90",
                header.column.getCanSort() &&
                  "cursor-pointer select-none hover:bg-primario-hover hover:text-white"
              )}
              onClick={header.column.getToggleSortingHandler()}
            >
              <div className="flex items-center gap-1">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
                {{
                  asc: <ChevronUp className="h-3 w-3 text-white" />,
                  desc: <ChevronDown className="h-3 w-3 text-white" />,
                }[header.column.getIsSorted() as string] ??
                  (header.column.getCanSort() && (
                    <ChevronsUpDown className="h-3 w-3 text-white/50" />
                  ))}
              </div>
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );

  const cuerpoFilas = filas.map((fila) => (
    <TableRow
      key={fila.id}
      className={cn(
        clasesFilaInteractiva,
        fila.index % 2 === 1 && "bg-superficie/50"
      )}
      onClick={() => onFilaClick?.(fila.original)}
    >
      {fila.getVisibleCells().map((celda) => (
        <TableCell key={celda.id} className="text-texto">
          {flexRender(celda.column.columnDef.cell, celda.getContext())}
        </TableCell>
      ))}
    </TableRow>
  ));

  const cuerpoVirtual = (
    <TableBody>
      {filasVirtuales.length > 0 && (
        <TableRow aria-hidden className="pointer-events-none border-0 hover:bg-transparent">
          <TableCell
            colSpan={cantidadColumnas}
            className="border-0 p-0"
            style={{ height: filasVirtuales[0].start }}
          />
        </TableRow>
      )}
      {filasVirtuales.map((filaVirtual) => {
        const fila = filas[filaVirtual.index];
        return (
          <TableRow
            key={fila.id}
            className={cn(
              clasesFilaInteractiva,
              fila.index % 2 === 1 && "bg-superficie/50"
            )}
            style={{ height: ALTURA_FILA }}
            onClick={() => onFilaClick?.(fila.original)}
          >
            {fila.getVisibleCells().map((celda) => (
              <TableCell key={celda.id} className="text-texto">
                {flexRender(celda.column.columnDef.cell, celda.getContext())}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
      {filasVirtuales.length > 0 && (
        <TableRow aria-hidden className="pointer-events-none border-0 hover:bg-transparent">
          <TableCell
            colSpan={cantidadColumnas}
            className="border-0 p-0"
            style={{
              height:
                virtualizer.getTotalSize() -
                (filasVirtuales[filasVirtuales.length - 1]?.end ?? 0),
            }}
          />
        </TableRow>
      )}
    </TableBody>
  );

  if (virtualizada) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-borde bg-white",
          className
        )}
      >
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <table className="w-full table-fixed caption-bottom text-sm">
            {encabezado}
            {cuerpoVirtual}
          </table>
        </div>
        <div className="flex-shrink-0 border-t border-borde px-4 py-2 text-xs text-gray-500">
          {filas.length} registro{filas.length === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-borde bg-white",
        className
      )}
    >
      <div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          {encabezado}
          <TableBody>{cuerpoFilas}</TableBody>
        </table>
      </div>
      {usarPaginacion && (
        <Paginacion
          pagina={tabla.getState().pagination.pageIndex + 1}
          totalPaginas={tabla.getPageCount()}
          totalRegistros={tabla.getFilteredRowModel().rows.length}
          limite={tabla.getState().pagination.pageSize}
          registrosEnPagina={filas.length}
          onChange={(p) => tabla.setPageIndex(p - 1)}
        />
      )}
    </div>
  );
}
