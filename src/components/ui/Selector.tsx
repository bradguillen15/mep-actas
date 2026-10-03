import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { clasesCampoBase } from "./estilos-campo";
import { Label } from "./label";

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  opciones: { valor: string | number; etiqueta: string }[];
  placeholder?: string;
}

export function Selector({
  label,
  error,
  ayuda,
  requerido,
  opciones,
  placeholder,
  className,
  id,
  ...props
}: SelectorProps) {
  const idGenerado = useId();
  const idReal = id ?? idGenerado;
  const idAyuda = `${idReal}-ayuda`;
  const idError = `${idReal}-error`;
  const descritoPor =
    [ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label htmlFor={idReal} className="text-texto">
          {label}
          {requerido && (
            <span aria-hidden="true" className="text-error">
              *
            </span>
          )}
        </Label>
      )}
      <div className="relative">
        <select
          id={idReal}
          aria-invalid={error ? true : undefined}
          aria-required={requerido || undefined}
          aria-describedby={descritoPor}
          className={cn(clasesCampoBase, "appearance-none pr-9", className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opciones.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.etiqueta}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-texto-suave"
        />
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-xs text-texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
