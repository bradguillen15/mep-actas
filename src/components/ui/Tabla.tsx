"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { FilasEsqueleto } from "./Esqueleto";
import { Paginacion } from "./Paginacion";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

const ALTURA_FILA = 53;
const ARIA_SORT = {
  asc: "ascending",
  desc: "descending",
} as const;

interface TablaProps<T> {
  columnas: ColumnDef<T>[];
  datos: T[];
  onFilaClick?: (fila: T) => void;
  paginacion?: boolean;
  virtualizada?: boolean;
  className?: string;
  cargando?: boolean;
  vacio?: ReactNode;
}

export function Tabla<T>({
  columnas,
  datos,
  onFilaClick,
  paginacion = true,
  virtualizada = false,
  className = "",
  cargando = false,
  vacio,
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
    ? "cursor-pointer transition-colors duration-150 outline-none hover-fino:bg-primario-suave focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primario/40"
    : "";

  const propiedadesFilaInteractiva = (fila: T) =>
    onFilaClick
      ? {
          tabIndex: 0,
          onClick: () => onFilaClick(fila),
          onKeyDown: (evento: KeyboardEvent<HTMLTableRowElement>) => {
            if (evento.target !== evento.currentTarget) return;
            if (evento.key === "Enter" || evento.key === " ") {
              evento.preventDefault();
              onFilaClick(fila);
            }
          },
        }
      : {};

  const encabezado = (
    <TableHeader className="sticky top-0 z-10 bg-primario shadow-[0_1px_0_0_var(--color-primario-hover)]">
      {tabla.getHeaderGroups().map((grupo) => (
        <TableRow key={grupo.id} className="border-primario-hover bg-primario hover:bg-primario">
          {grupo.headers.map((header) => (
            <TableHead
              key={header.id}
              aria-sort={
                header.column.getCanSort()
                  ? (ARIA_SORT[header.column.getIsSorted() as "asc" | "desc"] ?? "none")
                  : undefined
              }
              className={cn(
                "bg-primario text-xs font-semibold uppercase tracking-wider text-white/90",
                header.column.columnDef.meta?.className
              )}
            >
              {header.column.getCanSort() ? (
                <button
                  type="button"
                  onClick={header.column.getToggleSortingHandler()}
                  className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer select-none items-center gap-1 rounded px-2 py-1 text-left uppercase tracking-wider outline-none transition-colors duration-150 hover-fino:bg-primario-hover hover-fino:text-white focus-visible:ring-2 focus-visible:ring-acento"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: <ChevronUp aria-hidden className="size-3 text-white" />,
                    desc: <ChevronDown aria-hidden className="size-3 text-white" />,
                  }[header.column.getIsSorted() as string] ?? (
                    <ChevronsUpDown aria-hidden className="size-3 text-white/50" />
                  )}
                </button>
              ) : (
                flexRender(header.column.columnDef.header, header.getContext())
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );

  const celdas = (fila: (typeof filas)[number]) =>
    fila.getVisibleCells().map((celda) => (
      <TableCell
        key={celda.id}
        className={cn("text-texto", celda.column.columnDef.meta?.className)}
      >
        {flexRender(celda.column.columnDef.cell, celda.getContext())}
      </TableCell>
    ));

  const cuerpoFilas = cargando ? (
    <FilasEsqueleto filas={5} columnas={cantidadColumnas} />
  ) : filas.length === 0 && vacio ? (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={cantidadColumnas} className="whitespace-normal p-0">
        {vacio}
      </TableCell>
    </TableRow>
  ) : (
    filas.map((fila, indice) => (
      <TableRow
        key={fila.id}
        className={cn(
          clasesFilaInteractiva,
          "animate-in fade-in-0 slide-in-from-bottom-1 duration-200 fill-mode-backwards",
          fila.index % 2 === 1 && "bg-superficie/50"
        )}
        style={{ animationDelay: `${Math.min(indice, 8) * 30}ms` }}
        {...propiedadesFilaInteractiva(fila.original)}
      >
        {celdas(fila)}
      </TableRow>
    ))
  );

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
            {...propiedadesFilaInteractiva(fila.original)}
          >
            {celdas(fila)}
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
        <div className="flex-shrink-0 border-t border-borde px-4 py-2 text-xs text-texto-suave">
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
