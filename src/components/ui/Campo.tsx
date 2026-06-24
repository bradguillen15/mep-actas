import type { InputHTMLAttributes } from "react";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Campo({
  label,
  error,
  className = "",
  id,
  ...props
}: CampoProps) {
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
      <input
        id={idReal}
        className={`h-10 rounded-lg border border-borde bg-white px-3 text-sm text-texto placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primario/40 focus:border-primario disabled:bg-superficie disabled:opacity-60 ${error ? "border-error focus:ring-error/40" : ""} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
