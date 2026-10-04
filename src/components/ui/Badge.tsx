import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

type VarianteBadge = "info" | "exito" | "advertencia" | "error" | "neutral" | "neutro";

interface BadgeProps {
  variante?: VarianteBadge;
  children: string;
}

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variante: {
        info: "bg-primario/10 text-primario",
        exito: "bg-exito/10 text-exito",
        advertencia: "bg-acento/10 text-acento-texto",
        error: "bg-error/10 text-error",
        neutral: "bg-superficie text-texto",
        neutro: "bg-superficie text-texto",
      },
    },
    defaultVariants: {
      variante: "neutral",
    },
  }
);

export function Badge({ variante = "neutral", children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variante }))}>{children}</span>;
}
