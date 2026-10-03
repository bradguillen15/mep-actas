import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ListaDefinicionesProps {
  elementos: { etiqueta: string; valor: ReactNode }[];
  columnas?: 1 | 2;
}

export function ListaDefiniciones({ elementos, columnas = 2 }: ListaDefinicionesProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4",
        columnas === 2 && "sm:grid-cols-2"
      )}
    >
      {elementos.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="min-w-0">
          <dt className="text-xs font-medium text-texto-suave">{etiqueta}</dt>
          <dd className="mt-0.5 text-sm text-texto">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
