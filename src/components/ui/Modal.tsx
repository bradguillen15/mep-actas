"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { BotonIcono } from "./BotonIcono";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  pie?: ReactNode;
  tamano?: "sm" | "md" | "lg" | "xl";
  bloquearCierre?: boolean;
}

const tamanos: Record<NonNullable<ModalProps["tamano"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano = "md",
  bloquearCierre = false,
}: ModalProps) {
  return (
    <Dialog open={abierto} onOpenChange={(estado) => !estado && !bloquearCierre && onCerrar()}>
      <DialogContent
        showCloseButton={false}
        {...(!descripcion && { "aria-describedby": undefined })}
        className={cn("gap-0 overflow-hidden border-0 p-0", tamanos[tamano as keyof typeof tamanos])}
      >
        <div className="flex items-center justify-between gap-4 border-b-2 border-acento bg-primario px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-white">
            {titulo}
          </DialogTitle>
          <BotonIcono
            etiqueta="Cerrar"
            icono={<X />}
            disabled={bloquearCierre}
            onClick={onCerrar}
            className="text-white/75 hover-fino:bg-white/10 hover-fino:text-white focus-visible:ring-acento/60 focus-visible:ring-offset-0"
          />
        </div>
        {descripcion && (
          <DialogDescription className="px-6 pt-4 text-texto-suave">
            {descripcion}
          </DialogDescription>
        )}
        {children && (
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
        )}
        {pie && (
          <div className="flex flex-col-reverse gap-2 border-t border-borde bg-white px-6 py-4 sm:flex-row sm:justify-end">
            {pie}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
