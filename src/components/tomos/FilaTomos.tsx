"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Boton } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ResumenTomo {
  numeroTomo: number;
  cantidadFolios: number;
}

interface FilaTomosProps {
  tomos: ResumenTomo[];
  tomoSeleccionado: number | null;
  onElegir: (numeroTomo: number) => void;
}

const MASCARAS = {
  ninguna: "",
  izquierda: "[mask-image:linear-gradient(to_right,transparent,black_2rem)]",
  derecha: "[mask-image:linear-gradient(to_left,transparent,black_2rem)]",
  ambas:
    "[mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]",
} as const;

export function FilaTomos({ tomos, tomoSeleccionado, onElegir }: FilaTomosProps) {
  const filaRef = useRef<HTMLDivElement>(null);
  const [mascara, setMascara] = useState<string>(MASCARAS.ninguna);

  const medirDesborde = useCallback(() => {
    const fila = filaRef.current;
    if (!fila) return;
    const hayIzquierda = fila.scrollLeft > 1;
    const hayDerecha = fila.scrollLeft + fila.clientWidth < fila.scrollWidth - 1;
    setMascara(
      hayIzquierda && hayDerecha
        ? MASCARAS.ambas
        : hayIzquierda
          ? MASCARAS.izquierda
          : hayDerecha
            ? MASCARAS.derecha
            : MASCARAS.ninguna
    );
  }, []);

  useEffect(() => {
    medirDesborde();
    window.addEventListener("resize", medirDesborde);
    return () => window.removeEventListener("resize", medirDesborde);
  }, [tomos, medirDesborde]);

  useEffect(() => {
    filaRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [tomoSeleccionado]);

  return (
    <div
      ref={filaRef}
      role="group"
      aria-label="Tomos disponibles"
      onScroll={medirDesborde}
      className={cn(
        "flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]",
        mascara
      )}
    >
      {tomos.map((tomo) => {
        const seleccionado = tomo.numeroTomo === tomoSeleccionado;
        return (
          <Boton
            key={tomo.numeroTomo}
            type="button"
            tamano="sm"
            variante={seleccionado ? "primario" : "secundario"}
            aria-pressed={seleccionado}
            onClick={() => onElegir(tomo.numeroTomo)}
            className="shrink-0"
          >
            Tomo {tomo.numeroTomo}
            <span className="ml-1.5 tabular-nums opacity-80">
              · {tomo.cantidadFolios} folio
              {tomo.cantidadFolios !== 1 ? "s" : ""}
            </span>
          </Boton>
        );
      })}
    </div>
  );
}
