"use client";

import { useState } from "react";

import { Campo } from "@/components/ui/Campo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import { ZonaCarga } from "@/components/ui/ZonaCarga";
import {
  EXTENSIONES_PERMITIDAS,
  extensionDeArchivo,
  tipoContenidoDeArchivo,
} from "@/lib/escaneos";

interface ModalNuevoFolioProps {
  abierto: boolean;
  onCerrar: () => void;
  escuelaId: string;
  nombreEscuela?: string;
  onSubido: (tomo: number, folio: number) => Promise<void>;
}

const TAMANO_MAXIMO_MB = 20;

export function ModalNuevoFolio({
  abierto,
  onCerrar,
  escuelaId,
  nombreEscuela,
  onSubido,
}: ModalNuevoFolioProps) {
  const [tomo, setTomo] = useState("");
  const [folio, setFolio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const subir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const tipoContenido = tipoContenidoDeArchivo(archivo.name);
      if (!tipoContenido) throw new Error("Tipo de archivo no permitido");

      const preparacion = await fetch("/api/escaneos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escuelaId: Number(escuelaId),
          numeroTomo: Number(tomo),
          numeroFolio: Number(folio),
          formato: extensionDeArchivo(archivo.name),
        }),
      });
      if (!preparacion.ok) {
        const detalle = await preparacion
          .json()
          .catch(() => ({ error: "Error al preparar subida" }));
        throw new Error(detalle.error ?? "Error al preparar subida");
      }

      const { urlSubida } = await preparacion.json();
      const subida = await fetch(urlSubida, {
        method: "PUT",
        body: archivo,
        headers: { "Content-Type": tipoContenido },
      });
      if (!subida.ok) throw new Error("Error al subir el archivo");

      const tomoSubido = Number(tomo);
      const folioSubido = Number(folio);
      setTomo("");
      setFolio("");
      setArchivo(null);
      await onSubido(tomoSubido, folioSubido);
      onCerrar();
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <ModalFormulario
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nuevo folio"
      textoEnviar="Subir folio"
      onEnviar={subir}
      deshabilitado={!archivo || !tomo || !folio || !escuelaId || subiendo}
    >
      <p className="text-sm text-texto-suave">
        {nombreEscuela ? `Escuela: ${nombreEscuela}` : "Se subirá a su escuela."}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="N° de tomo"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Ej: 4"
          value={tomo}
          onChange={(e) => setTomo(e.target.value)}
        />
        <Campo
          label="N° de folio"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Ej: 1"
          value={folio}
          onChange={(e) => setFolio(e.target.value)}
        />
      </div>
      <ZonaCarga
        archivo={archivo}
        onArchivo={setArchivo}
        extensionesPermitidas={EXTENSIONES_PERMITIDAS}
        tamanoMaximoMb={TAMANO_MAXIMO_MB}
        deshabilitada={subiendo}
      />
    </ModalFormulario>
  );
}
