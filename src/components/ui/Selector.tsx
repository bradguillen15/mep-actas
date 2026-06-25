import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  opciones: { valor: string | number; etiqueta: string }[];
  placeholder?: string;
}

export function Selector({
  label,
  error,
  opciones,
  placeholder,
  className,
  id,
  ...props
}: SelectorProps) {
  const idReal = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <Label htmlFor={idReal} className="text-texto">
          {label}
        </Label>
      )}
      <select
        id={idReal}
        className={cn(
          "h-10 rounded-lg border border-input bg-white px-3 text-sm text-texto outline-none transition-colors focus-visible:border-primario focus-visible:ring-2 focus-visible:ring-primario/40 disabled:bg-superficie disabled:opacity-60",
          error && "border-error",
          className
        )}
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
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
