"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { BotonIcono } from "./BotonIcono";
import {
  Dialog,
  DialogClose,
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
        className={cn("gap-0 p-0", tamanos[tamano as keyof typeof tamanos])}
      >
        <div className="flex items-center justify-between gap-4 border-b border-borde px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-texto">
            {titulo}
          </DialogTitle>
          <DialogClose asChild>
            <BotonIcono etiqueta="Cerrar" icono={<X />} disabled={bloquearCierre} />
          </DialogClose>
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
