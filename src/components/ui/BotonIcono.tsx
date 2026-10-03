import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const botonIconoVariantes = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg text-texto-suave outline-none transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variante: {
        neutro: "hover-fino:bg-superficie hover-fino:text-texto",
        peligro: "hover-fino:bg-error/10 hover-fino:text-error",
      },
      tamano: {
        md: "size-9",
        sm: "size-8",
      },
    },
    defaultVariants: { variante: "neutro", tamano: "md" },
  }
);

interface BotonIconoProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof botonIconoVariantes> {
  etiqueta: string;
  icono: ReactNode;
}

export function BotonIcono({
  etiqueta,
  icono,
  variante,
  tamano,
  className,
  type = "button",
  ...props
}: BotonIconoProps) {
  return (
    <button
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(botonIconoVariantes({ variante, tamano }), className)}
      {...props}
    >
      {icono}
    </button>
  );
}
