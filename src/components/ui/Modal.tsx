"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "./dialog";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  tamano?: "sm" | "md" | "lg" | "xl";
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
  children,
  tamano = "md",
}: ModalProps) {
  return (
    <Dialog open={abierto} onOpenChange={(estado) => !estado && onCerrar()}>
      <DialogContent
        showCloseButton={false}
        className={cn("gap-0 p-0", tamanos[tamano as keyof typeof tamanos])}
      >
        <div className="flex items-center justify-between border-b border-borde px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-texto">
            {titulo}
          </DialogTitle>
          <DialogClose className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-superficie hover:text-texto">
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
