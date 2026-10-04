"use client";

import type { KeyboardEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { BotonIcono } from "@/components/ui/BotonIcono";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface VisorPantallaCompletaProps {
  abierto: boolean;
  onCerrar: () => void;
  urlImagen: string;
  titulo: string;
  hayAnterior: boolean;
  haySiguiente: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
}

const ESTILO_BOTON_OSCURO =
  "size-11 rounded-full bg-white/10 text-white hover-fino:bg-white/20 hover-fino:text-white focus-visible:ring-acento focus-visible:ring-offset-0 disabled:opacity-30";

export function VisorPantallaCompleta({
  abierto,
  onCerrar,
  urlImagen,
  titulo,
  hayAnterior,
  haySiguiente,
  onAnterior,
  onSiguiente,
}: VisorPantallaCompletaProps) {
  const alPresionarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === "ArrowLeft" && hayAnterior) {
      evento.preventDefault();
      onAnterior();
    }
    if (evento.key === "ArrowRight" && haySiguiente) {
      evento.preventDefault();
      onSiguiente();
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(estado) => !estado && onCerrar()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onKeyDown={alPresionarTecla}
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          (evento.currentTarget as HTMLElement | null)?.focus();
        }}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black/95 p-0 shadow-none sm:max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 text-white">
          <DialogTitle className="text-base font-medium text-white">{titulo}</DialogTitle>
          <BotonIcono
            etiqueta="Cerrar pantalla completa"
            icono={<X />}
            onClick={onCerrar}
            className={ESTILO_BOTON_OSCURO}
          />
        </div>
        <div className="relative min-h-0 flex-1">
          <Image
            src={urlImagen}
            unoptimized={urlImagen.startsWith("/")}
            alt={titulo}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <BotonIcono
            etiqueta="Folio anterior"
            icono={<ChevronLeft />}
            disabled={!hayAnterior}
            onClick={onAnterior}
            className={`absolute top-1/2 left-4 -translate-y-1/2 ${ESTILO_BOTON_OSCURO}`}
          />
          <BotonIcono
            etiqueta="Folio siguiente"
            icono={<ChevronRight />}
            disabled={!haySiguiente}
            onClick={onSiguiente}
            className={`absolute top-1/2 right-4 -translate-y-1/2 ${ESTILO_BOTON_OSCURO}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
