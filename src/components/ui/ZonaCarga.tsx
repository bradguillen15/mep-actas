"use client";

import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FileText, Upload, X } from "lucide-react";

import { extensionDeArchivo, tipoContenidoDeArchivo } from "@/lib/escaneos";
import { cn } from "@/lib/utils";
import { BotonIcono } from "./BotonIcono";

interface ZonaCargaProps {
  archivo: File | null;
  onArchivo: (archivo: File | null) => void;
  extensionesPermitidas: readonly string[];
  tamanoMaximoMb: number;
  deshabilitada?: boolean;
  className?: string;
}

const BYTES_POR_MB = 1024 * 1024;

const extensionesLegibles = (extensiones: readonly string[]) =>
  extensiones.map((extension) => extension.toUpperCase()).join(", ");

function formatearTamano(bytes: number) {
  if (bytes >= BYTES_POR_MB) return `${(bytes / BYTES_POR_MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ZonaCarga({
  archivo,
  onArchivo,
  extensionesPermitidas,
  tamanoMaximoMb,
  deshabilitada = false,
  className,
}: ZonaCargaProps) {
  const idError = useId();
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo || !tipoContenidoDeArchivo(archivo.name)?.startsWith("image/")) return;
    const url = URL.createObjectURL(archivo);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la URL de objeto solo existe en el cliente
    setVistaPrevia(url);
    return () => {
      URL.revokeObjectURL(url);
      setVistaPrevia(null);
    };
  }, [archivo]);

  const validar = (candidato: File): string => {
    if (!extensionesPermitidas.includes(extensionDeArchivo(candidato.name))) {
      return `Tipo de archivo no permitido. Use ${extensionesLegibles(extensionesPermitidas)}.`;
    }
    if (candidato.size > tamanoMaximoMb * BYTES_POR_MB) {
      return `El archivo supera el máximo de ${tamanoMaximoMb} MB.`;
    }
    return "";
  };

  const recibir = (candidato: File | undefined) => {
    if (!candidato) return;
    const mensaje = validar(candidato);
    setError(mensaje);
    if (!mensaje) onArchivo(candidato);
  };

  const alCambiar = (evento: ChangeEvent<HTMLInputElement>) => {
    recibir(evento.target.files?.[0]);
    evento.target.value = "";
  };

  const alSoltar = (evento: DragEvent<HTMLLabelElement>) => {
    evento.preventDefault();
    setArrastrando(false);
    if (deshabilitada) return;
    recibir(evento.dataTransfer.files?.[0]);
  };

  const alArrastrar = (evento: DragEvent<HTMLLabelElement>) => {
    evento.preventDefault();
    if (!deshabilitada) setArrastrando(true);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label
        data-testid="zona-carga"
        onDragEnter={alArrastrar}
        onDragOver={alArrastrar}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-[border-color,background-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primario has-[:focus-visible]:ring-offset-2 hover-fino:border-primario",
          arrastrando
            ? "border-primario bg-primario-suave"
            : "border-borde bg-superficie",
          deshabilitada && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          type="file"
          className="sr-only"
          accept={extensionesPermitidas.map((extension) => `.${extension}`).join(",")}
          disabled={deshabilitada}
          aria-describedby={error ? idError : undefined}
          onChange={alCambiar}
        />
        <Upload aria-hidden className="size-6 text-texto-suave" />
        <span className="text-sm font-medium text-texto">
          Arrastre un archivo o haga clic para seleccionar
        </span>
        <span className="text-xs text-texto-suave">
          {extensionesLegibles(extensionesPermitidas)} · máximo {tamanoMaximoMb} MB
        </span>
      </label>

      {error && (
        <p id={idError} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}

      {archivo && (
        <div className="flex items-center gap-3 rounded-lg border border-borde bg-white p-2 animate-in fade-in-0 duration-200">
          {vistaPrevia ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL de objeto local
            <img
              src={vistaPrevia}
              alt={`Vista previa de ${archivo.name}`}
              className="size-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="grid size-12 shrink-0 place-items-center rounded-md bg-superficie text-texto-suave">
              <FileText aria-hidden className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-texto">{archivo.name}</p>
            <p className="text-xs tabular-nums text-texto-suave">
              {formatearTamano(archivo.size)}
            </p>
          </div>
          <BotonIcono
            etiqueta="Quitar archivo"
            icono={<X />}
            disabled={deshabilitada}
            onClick={() => {
              setError("");
              onArchivo(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
