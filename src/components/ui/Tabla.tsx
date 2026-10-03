"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { useMediaMin } from "@/hooks/useMediaMin";
import { LIMITE_PAGINA_POR_DEFECTO } from "@/lib/paginacion";
import { cn } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Esqueleto, FilasEsqueleto } from "./Esqueleto";
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
  numeracion?: boolean;
  indiceInicio?: number;
  className?: string;
  cargando?: boolean;
  vacio?: ReactNode;
}

export function Tabla<T>({
  columnas,
  datos,
  onFilaClick,
  paginacion = true,
  numeracion = true,
  indiceInicio = 0,
  className = "",
  cargando = false,
  vacio,
}: TablaProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [estadoPaginacion, setEstadoPaginacion] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: LIMITE_PAGINA_POR_DEFECTO,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const esEscritorio = useMediaMin(768);

  const columnasConNumero = useMemo(() => {
    if (!numeracion) return columnas;

    const columnaNumero: ColumnDef<T> = {
      id: "__numero",
      header: "#",
      enableSorting: false,
      meta: {
        className:
          "w-[1%] whitespace-nowrap px-3 text-center tabular-nums text-texto-suave",
      },
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        const base = paginacion ? pageIndex * pageSize : indiceInicio;
        return base + row.index + 1;
      },
    };

    return [columnaNumero, ...columnas];
  }, [columnas, numeracion, paginacion, indiceInicio]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const tabla = useReactTable({
    data: datos,
    columns: columnasConNumero,
    state: {
      sorting,
      ...(paginacion ? { pagination: estadoPaginacion } : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange: paginacion ? setEstadoPaginacion : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: paginacion ? getPaginationRowModel() : undefined,
  });

  const filas = tabla.getRowModel().rows;
  const cantidadColumnas = tabla.getAllColumns().length;
  const mostrarVirtual = !cargando && !(filas.length === 0 && vacio);

  const virtualizer = useVirtualizer({
    count: mostrarVirtual ? filas.length : 0,
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
                "sticky top-0 bg-primario px-3 text-xs font-semibold uppercase tracking-wider text-white/90",
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
        className={cn(
          "px-3 py-2.5 text-texto",
          celda.column.columnDef.meta?.className
        )}
      >
        {flexRender(celda.column.columnDef.cell, celda.getContext())}
      </TableCell>
    ));

  const cuerpo = (() => {
    if (cargando) {
      return <FilasEsqueleto filas={5} columnas={cantidadColumnas} />;
    }
    if (filas.length === 0 && vacio) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={cantidadColumnas} className="whitespace-normal p-0">
            {vacio}
          </TableCell>
        </TableRow>
      );
    }

    if (filasVirtuales.length === 0) {
      return filas.map((fila, indice) => (
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
      ));
    }

    return (
      <>
        <TableRow aria-hidden className="pointer-events-none border-0 hover:bg-transparent">
          <TableCell
            colSpan={cantidadColumnas}
            className="border-0 p-0"
            style={{ height: filasVirtuales[0].start }}
          />
        </TableRow>
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
      </>
    );
  })();

  const cambiarLimite = (limite: number) => {
    setEstadoPaginacion({ pageIndex: 0, pageSize: limite });
  };

  const pie = paginacion ? (
    <div className="shrink-0">
      <Paginacion
        pagina={tabla.getState().pagination.pageIndex + 1}
        totalPaginas={tabla.getPageCount()}
        totalRegistros={tabla.getFilteredRowModel().rows.length}
        limite={tabla.getState().pagination.pageSize}
        registrosEnPagina={filas.length}
        onChange={(p) => tabla.setPageIndex(p - 1)}
        onLimiteChange={cambiarLimite}
      />
    </div>
  ) : null;

  if (!esEscritorio) {
    return (
      <div
        data-testid="tabla-contenedor"
        className={cn(
          "flex h-0 min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-borde bg-white",
          className
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {cargando ? (
            <ul className="flex flex-col gap-3" aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="rounded-xl border border-borde p-4">
                  <Esqueleto className="mb-2 h-4 w-2/3" />
                  <Esqueleto className="mb-1 h-3 w-full" />
                  <Esqueleto className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          ) : filas.length === 0 && vacio ? (
            vacio
          ) : (
            <ul aria-label="Lista de registros" className="flex flex-col gap-3">
              {filas.map((fila) => {
                const celdasVisibles = fila
                  .getVisibleCells()
                  .filter((celda) => celda.column.id !== "__numero");
                const [principal, ...resto] = celdasVisibles;
                const numero = numeracion
                  ? fila.getVisibleCells().find((c) => c.column.id === "__numero")
                  : undefined;

                return (
                  <li key={fila.id}>
                    <div
                      className={cn(
                        "rounded-xl border border-borde bg-white p-4",
                        onFilaClick &&
                          "cursor-pointer outline-none transition-colors duration-150 hover-fino:bg-primario-suave focus-visible:ring-2 focus-visible:ring-primario/40"
                      )}
                      {...(onFilaClick
                        ? {
                            role: "button",
                            tabIndex: 0,
                            onClick: () => onFilaClick(fila.original),
                            onKeyDown: (evento: KeyboardEvent<HTMLDivElement>) => {
                              if (evento.key === "Enter" || evento.key === " ") {
                                evento.preventDefault();
                                onFilaClick(fila.original);
                              }
                            },
                          }
                        : {})}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 text-sm font-medium text-texto">
                          {principal &&
                            flexRender(
                              principal.column.columnDef.cell,
                              principal.getContext()
                            )}
                        </div>
                        {numero && (
                          <span className="shrink-0 text-xs tabular-nums text-texto-suave">
                            #
                            {flexRender(
                              numero.column.columnDef.cell,
                              numero.getContext()
                            )}
                          </span>
                        )}
                      </div>
                      {resto.length > 0 && (
                        <dl className="mt-3 space-y-2 border-t border-borde pt-3">
                          {resto.map((celda) => {
                            const etiqueta =
                              typeof celda.column.columnDef.header === "string"
                                ? celda.column.columnDef.header
                                : celda.column.id;
                            return (
                              <div
                                key={celda.id}
                                className="flex items-start justify-between gap-3 text-sm"
                              >
                                <dt className="shrink-0 text-texto-suave">{etiqueta}</dt>
                                <dd className="min-w-0 text-right text-texto">
                                  {flexRender(
                                    celda.column.columnDef.cell,
                                    celda.getContext()
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {pie}
      </div>
    );
  }

  return (
    <div
      data-testid="tabla-contenedor"
      className={cn(
        "flex h-0 min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-borde bg-white",
        className
      )}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]"
      >
        <table className="w-max min-w-full border-separate border-spacing-0 caption-bottom text-sm">
          {encabezado}
          <TableBody>{cuerpo}</TableBody>
        </table>
      </div>
      {pie}
    </div>
  );
}
