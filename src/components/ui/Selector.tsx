"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const VALOR_VACIO = "__vacio__";

export interface OpcionSelector {
  valor: string | number;
  etiqueta: string;
}

export interface CambioSelector {
  target: { value: string; name: string };
}

interface SelectorProps {
  label?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  opciones: OpcionSelector[];
  placeholder?: string;
  value?: string | number;
  name?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  onChange?: (evento: CambioSelector) => void;
  onBlur?: () => void;
}

function aValorRadix(
  valor: string | number,
  opciones: OpcionSelector[]
): string | undefined {
  const texto = String(valor);
  if (texto === "") {
    return opciones.some((opcion) => String(opcion.valor) === "")
      ? VALOR_VACIO
      : undefined;
  }
  return texto;
}

function desdeValorRadix(valor: string): string {
  return valor === VALOR_VACIO ? "" : valor;
}

export function Selector({
  label,
  error,
  ayuda,
  requerido,
  opciones,
  placeholder,
  value,
  name = "",
  disabled,
  autoFocus,
  className,
  id,
  "aria-label": ariaLabel,
  onChange,
  onBlur,
}: SelectorProps) {
  const idGenerado = useId();
  const idReal = id ?? idGenerado;
  const idAyuda = `${idReal}-ayuda`;
  const idError = `${idReal}-error`;
  const descritoPor =
    [ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined;

  const controlado = value !== undefined;
  const valorRadix = controlado ? aValorRadix(value, opciones) : undefined;

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
      <Select
        value={controlado ? (valorRadix ?? "") : undefined}
        onValueChange={(siguiente) => {
          onChange?.({
            target: { value: desdeValorRadix(siguiente), name },
          });
        }}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger
          id={idReal}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-required={requerido || undefined}
          aria-describedby={descritoPor}
          onBlur={onBlur}
          className={cn("w-full", className)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => {
            const valorItem = aValorRadix(opcion.valor, opciones) ?? VALOR_VACIO;
            return (
              <SelectItem key={valorItem} value={valorItem}>
                {opcion.etiqueta}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
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
