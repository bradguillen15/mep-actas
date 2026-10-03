"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

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
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) setError("");
  }, [abierto]);

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
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <form onSubmit={manejarEnvio} className="flex flex-col gap-4" noValidate>
        {children}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error"
          >
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={enviando} disabled={deshabilitado}>
            {textoEnviar}
          </Boton>
        </div>
      </form>
    </Modal>
  );
}
