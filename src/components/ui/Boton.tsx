import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type buttonVariants } from "./button";
import type { VariantProps } from "class-variance-authority";

type Variante = "primario" | "secundario" | "peligro" | "ghost" | "acento";
type Tamano = "sm" | "md" | "lg";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  children: ReactNode;
}

type VarianteShadcn = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

const varianteBase: Record<Variante, VarianteShadcn> = {
  primario: "default",
  secundario: "outline",
  peligro: "destructive",
  ghost: "ghost",
  acento: "default",
};

const varianteClases: Record<Variante, string> = {
  primario: "hover:bg-primario-hover",
  secundario: "border-borde bg-white text-texto hover:bg-superficie hover:text-texto",
  peligro: "hover:bg-red-700",
  ghost: "text-texto hover:bg-superficie hover:text-texto",
  acento: "bg-acento text-primario hover:bg-acento-suave",
};

const tamanoClases: Record<Tamano, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-8 text-base",
};

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  children,
  className,
  disabled,
  ...props
}: BotonProps) {
  return (
    <Button
      variant={varianteBase[variante as keyof typeof varianteBase]}
      className={cn(
        "focus-visible:ring-primario focus-visible:ring-offset-2",
        varianteClases[variante as keyof typeof varianteClases],
        tamanoClases[tamano as keyof typeof tamanoClases],
        className
      )}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
