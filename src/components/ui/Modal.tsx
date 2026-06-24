"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  tamano?: "sm" | "md" | "lg" | "xl";
}

const tamanos: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  tamano = "md",
}: ModalProps) {
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    if (abierto) {
      document.addEventListener("keydown", manejarEscape);
    }
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onCerrar}
      />
      <div
        className={`relative z-10 w-full ${tamanos[tamano]} mx-4 rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-borde px-6 py-4">
          <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:text-texto hover:bg-superficie transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
