"use client";

import { useState } from "react";

import { Boton } from "./Boton";
import { Modal } from "./Modal";

interface DialogoConfirmacionProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void | Promise<void>;
  titulo: string;
  descripcion: string;
  etiquetaConfirmar?: string;
  variante?: "peligro" | "primario";
}

export function DialogoConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  etiquetaConfirmar = "Confirmar",
  variante = "primario",
}: DialogoConfirmacionProps) {
  const [confirmando, setConfirmando] = useState(false);

  const confirmar = async () => {
    setConfirmando(true);
    try {
      await onConfirmar();
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={descripcion}
      tamano="sm"
      bloquearCierre={confirmando}
      pie={
        <>
          <Boton
            variante="secundario"
            onClick={onCerrar}
            disabled={confirmando}
          >
            Cancelar
          </Boton>
          <Boton variante={variante} cargando={confirmando} onClick={confirmar}>
            {etiquetaConfirmar}
          </Boton>
        </>
      }
    />
  );
}
