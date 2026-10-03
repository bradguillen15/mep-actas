"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { BotonIcono } from "./BotonIcono";
import { clasesCampoBase } from "./estilos-campo";
import { Input } from "./input";
import { Label } from "./label";

interface CampoContrasenaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
}

export function CampoContrasena({
  label,
  error,
  ayuda,
  requerido,
  className,
  id,
  ...props
}: CampoContrasenaProps) {
  const idGenerado = useId();
  const idReal = id ?? idGenerado;
  const idAyuda = `${idReal}-ayuda`;
  const idError = `${idReal}-error`;
  const descritoPor =
    [ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined;
  const [visible, setVisible] = useState(false);

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
        <Input
          id={idReal}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-required={requerido || undefined}
          aria-describedby={descritoPor}
          className={cn(clasesCampoBase, "pr-11", className)}
          {...props}
        />
        <BotonIcono
          etiqueta={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          tamano="sm"
          onClick={() => setVisible((actual) => !actual)}
          icono={visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          className="absolute top-1/2 right-1 -translate-y-1/2 active:scale-[0.95]"
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
