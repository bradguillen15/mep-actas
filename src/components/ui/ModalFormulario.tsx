"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Alerta } from "./Alerta";
import { Boton } from "./Boton";
import { Modal } from "./Modal";

interface ModalFormularioProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  onEnviar: () => Promise<void>;
  textoEnviar?: string;
  deshabilitado?: boolean;
}

export function ModalFormulario({
  abierto,
  onCerrar,
  titulo,
  children,
  onEnviar,
  textoEnviar = "Guardar",
  deshabilitado = false,
}: ModalFormularioProps) {
  const idFormulario = useId();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [abiertoPrevio, setAbiertoPrevio] = useState(abierto);

  if (abierto !== abiertoPrevio) {
    setAbiertoPrevio(abierto);
    if (!abierto) setError("");
  }

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await onEnviar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      pie={
        <>
          <Boton
            type="button"
            variante="secundario"
            onClick={onCerrar}
            disabled={enviando}
          >
            Cancelar
          </Boton>
          <Boton
            type="submit"
            variante="acento"
            form={idFormulario}
            cargando={enviando}
            disabled={deshabilitado}
          >
            {textoEnviar}
          </Boton>
        </>
      }
    >
      <form
        id={idFormulario}
        onSubmit={manejarEnvio}
        className="flex flex-col gap-4"
        noValidate
      >
        {children}
        {error && <Alerta variante="error">{error}</Alerta>}
      </form>
    </Modal>
  );
}
