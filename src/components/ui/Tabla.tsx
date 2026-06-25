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
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Paginacion } from "./Paginacion";

interface TablaProps<T> {
  columnas: ColumnDef<T>[];
  datos: T[];
  onFilaClick?: (fila: T) => void;
  paginacion?: boolean;
  className?: string;
}

export function Tabla<T>({
  columnas,
  datos,
  onFilaClick,
  paginacion = true,
  className = "",
}: TablaProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: paginacion ? getPaginationRowModel() : undefined,
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-borde bg-white",
        className
      )}
    >
      <Table>
        <TableHeader>
          {tabla.getHeaderGroups().map((grupo) => (
            <TableRow key={grupo.id} className="bg-superficie hover:bg-superficie">
              {grupo.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider text-gray-500",
                    header.column.getCanSort() &&
                      "cursor-pointer select-none hover:text-texto"
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: <ChevronUp className="h-3 w-3" />,
                      desc: <ChevronDown className="h-3 w-3" />,
                    }[header.column.getIsSorted() as string] ??
                      (header.column.getCanSort() && (
                        <ChevronsUpDown className="h-3 w-3 text-gray-300" />
                      ))}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {tabla.getRowModel().rows.map((fila) => (
            <TableRow
              key={fila.id}
              className={cn(
                onFilaClick && "cursor-pointer",
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
          ))}
        </TableBody>
      </Table>
      {paginacion && (
        <Paginacion
          pagina={tabla.getState().pagination.pageIndex + 1}
          totalPaginas={tabla.getPageCount()}
          totalRegistros={tabla.getFilteredRowModel().rows.length}
          onChange={(p) => tabla.setPageIndex(p - 1)}
        />
      )}
    </div>
  );
}
