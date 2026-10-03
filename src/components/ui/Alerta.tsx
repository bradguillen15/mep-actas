import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

type VarianteAlerta = "error" | "exito" | "info" | "advertencia";

const alertaVariantes = cva(
  "flex gap-2 rounded-lg px-4 py-3 text-sm animate-in fade-in-0 slide-in-from-top-1 duration-150",
  {
    variants: {
      variante: {
        error: "bg-error/10 text-error",
        exito: "bg-exito/10 text-exito",
        info: "bg-primario/10 text-primario",
        advertencia: "bg-acento/10 text-acento-texto",
      },
    },
    defaultVariants: { variante: "info" },
  }
);

const iconos = {
  error: AlertCircle,
  exito: CheckCircle2,
  info: Info,
  advertencia: TriangleAlert,
} as const;

interface AlertaProps {
  variante?: VarianteAlerta;
  children: ReactNode;
  className?: string;
}

export function Alerta({ variante = "info", children, className }: AlertaProps) {
  const Icono = iconos[variante as keyof typeof iconos];
  const role = variante === "error" || variante === "advertencia" ? "alert" : "status";
  return (
    <div role={role} className={cn(alertaVariantes({ variante }), className)}>
      <Icono aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
