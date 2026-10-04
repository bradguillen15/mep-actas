import { useId, type ReactNode } from "react";

import { Tarjeta } from "@/components/ui/Tarjeta";

interface SeccionProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}

export function Seccion({ titulo, descripcion, acciones, children }: SeccionProps) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="flex min-h-0 flex-col">
      <Tarjeta className="min-h-0 flex-1">
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-texto">
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
            )}
          </div>
          {acciones && <div className="shrink-0">{acciones}</div>}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </Tarjeta>
    </section>
  );
}
