import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

interface EstadoVacioProps {
  mensaje: string;
  descripcion?: string;
  accion?: ReactNode;
  icono?: ReactNode;
  variante?: "vacio" | "error";
}

export function EstadoVacio({
  mensaje,
  descripcion,
  accion,
  icono,
  variante = "vacio",
}: EstadoVacioProps) {
  const Icono = variante === "error" ? AlertCircle : Inbox;
  return (
    <div
      role={variante === "error" ? "alert" : undefined}
      className="flex animate-in flex-col items-center justify-center gap-3 py-16 text-center duration-200 fade-in-0"
    >
      <div
        aria-hidden="true"
        className={cn(
          "grid size-12 place-items-center rounded-full bg-superficie",
          variante === "error" ? "text-error" : "text-texto-suave"
        )}
      >
        {icono ?? <Icono className="size-6" />}
      </div>
      <p className="text-lg font-medium text-texto">{mensaje}</p>
      {descripcion && (
        <p className="max-w-sm text-sm text-texto-suave">{descripcion}</p>
      )}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
