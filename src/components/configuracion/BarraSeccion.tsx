import type { ReactNode } from "react";

interface BarraSeccionProps {
  texto?: string;
  accion?: ReactNode;
}

export function BarraSeccion({ texto, accion }: BarraSeccionProps) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <p className="text-sm text-texto-suave tabular-nums">{texto}</p>
      {accion}
    </div>
  );
}

export const textoConteo = (cantidad: number, singular: string, plural: string) =>
  `${cantidad} ${cantidad === 1 ? singular : plural}`;
