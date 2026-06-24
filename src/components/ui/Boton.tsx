import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "peligro" | "ghost" | "acento";
type Tamano = "sm" | "md" | "lg";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  children: ReactNode;
}

const clasesBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primario/40";

const variantes: Record<Variante, string> = {
  primario: "bg-primario text-white hover:bg-primario-hover active:bg-primario-hover",
  secundario: "border border-borde bg-white text-texto hover:bg-superficie",
  peligro: "bg-error text-white hover:bg-red-700",
  ghost: "text-texto hover:bg-superficie",
  acento: "bg-acento text-white hover:bg-amber-600",
};

const tamanos: Record<Tamano, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Boton({
  variante = "primario",
  tamano = "md",
  cargando = false,
  children,
  className = "",
  disabled,
  ...props
}: BotonProps) {
  return (
    <button
      className={`${clasesBase} ${variantes[variante as keyof typeof variantes]} ${tamanos[tamano as keyof typeof tamanos]} ${className}`}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
