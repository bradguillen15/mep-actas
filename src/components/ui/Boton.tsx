import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

type Variante = "primario" | "secundario" | "peligro" | "ghost" | "acento";
type Tamano = "sm" | "md" | "lg";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const varianteBase = {
  primario: "default",
  secundario: "outline",
  peligro: "destructive",
  ghost: "ghost",
  acento: "acento",
} as const;

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  asChild = false,
  children,
  disabled,
  ...props
}: BotonProps) {
  if (asChild) {
    return (
      <Button asChild variant={varianteBase[variante as keyof typeof varianteBase]} size={tamano} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      variant={varianteBase[variante as keyof typeof varianteBase]}
      size={tamano}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-2", cargando && "opacity-0")}>
        {children}
      </span>
      {cargando && (
        <Loader2
          aria-hidden
          className="absolute size-4 animate-[spin_0.7s_linear_infinite]"
        />
      )}
    </Button>
  );
}
