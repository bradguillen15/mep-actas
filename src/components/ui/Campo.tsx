import { useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { clasesCampoBase } from "./estilos-campo";
import { Input } from "./input";
import { Label } from "./label";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
}

export function Campo({
  label,
  error,
  ayuda,
  requerido,
  className,
  id,
  ...props
}: CampoProps) {
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
      <Input
        id={idReal}
        aria-invalid={error ? true : undefined}
        aria-required={requerido || undefined}
        aria-describedby={descritoPor}
        className={cn(clasesCampoBase, className)}
        {...props}
      />
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
