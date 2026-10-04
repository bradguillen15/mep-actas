"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { BotonIcono } from "../ui/BotonIcono";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

const SELECTOR_ENFOCABLES =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

interface CajonNavegacionProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function CajonNavegacion({ abierto, onCerrar }: CajonNavegacionProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const elementoPrevioRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    elementoPrevioRef.current = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-cierre-cajon]")?.focus();

    const manejarTeclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !panelRef.current) return;

      const enfocables = panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES);
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;
      const dentro = panelRef.current.contains(activo);

      if (evento.shiftKey && (activo === primero || !dentro)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (activo === ultimo || !dentro)) {
        evento.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", manejarTeclado);

    return () => {
      document.removeEventListener("keydown", manejarTeclado);
      document.body.style.overflow = overflowPrevio;
      elementoPrevioRef.current?.focus();
      elementoPrevioRef.current = null;
    };
  }, [abierto, onCerrar]);

  return (
    <div className="md:hidden">
      <div
        data-testid="fondo-cajon"
        aria-hidden="true"
        onClick={onCerrar}
        className={cn(
          "fixed inset-0 z-40 bg-primario/40 backdrop-blur-[2px] transition-opacity ease-out",
          abierto ? "opacity-100 duration-200" : "pointer-events-none opacity-0 duration-150"
        )}
      />
      <div
        id="cajon-navegacion"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        inert={!abierto}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform ease-(--ease-drawer)",
          abierto ? "translate-x-0 duration-200" : "-translate-x-full duration-150"
        )}
      >
        <Sidebar
          onNavegar={onCerrar}
          accionCabecera={
            <BotonIcono
              etiqueta="Cerrar menú"
              icono={<X aria-hidden="true" />}
              onClick={onCerrar}
              data-cierre-cajon=""
              className="size-10 text-white/75 hover-fino:bg-white/5 hover-fino:text-white focus-visible:ring-acento/60 focus-visible:ring-offset-0"
            />
          }
        />
      </div>
    </div>
  );
}
