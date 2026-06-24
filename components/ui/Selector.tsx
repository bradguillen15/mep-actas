import type { SelectHTMLAttributes } from "react";

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
  className = "",
  id,
  ...props
}: SelectorProps) {
  const idReal = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={idReal}
          className="text-sm font-medium text-texto"
        >
          {label}
        </label>
      )}
      <select
        id={idReal}
        className={`h-10 rounded-lg border border-borde bg-white px-3 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-primario/40 focus:border-primario disabled:bg-superficie disabled:opacity-60 ${error ? "border-error" : ""} ${className}`}
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
