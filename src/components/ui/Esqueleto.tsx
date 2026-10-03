import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "./table";

export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-superficie", className)}
    />
  );
}

interface FilasEsqueletoProps {
  filas?: number;
  columnas: number;
}

export function FilasEsqueleto({ filas = 5, columnas }: FilasEsqueletoProps) {
  return Array.from({ length: filas }, (_, fila) => (
    <TableRow key={fila} aria-hidden="true" className="hover:bg-transparent">
      {Array.from({ length: columnas }, (_, columna) => (
        <TableCell key={columna}>
          <Esqueleto className="h-4 w-full max-w-40" />
        </TableCell>
      ))}
    </TableRow>
  ));
}
