"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const RanuraAccionesContext = createContext<HTMLElement | null | undefined>(undefined);

export function AccionesPestana({ children }: { children: ReactNode }) {
  const ranura = useContext(RanuraAccionesContext);
  if (ranura === undefined) return <>{children}</>;
  if (ranura === null) return null;
  return createPortal(children, ranura);
}

interface PestanaDefinicion {
  id: string;
  etiqueta: string;
}

interface PestanasProps {
  pestanas: PestanaDefinicion[];
  activa: string;
  onCambiar: (id: string) => void;
  etiqueta: string;
  children: ReactNode;
}

interface Indicador {
  izquierda: number;
  ancho: number;
}

export function Pestanas({
  pestanas,
  activa,
  onCambiar,
  etiqueta,
  children,
}: PestanasProps) {
  const idBase = useId();
  const listaRef = useRef<HTMLDivElement>(null);
  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [ranuraAcciones, setRanuraAcciones] = useState<HTMLDivElement | null>(null);

  const idPestana = (id: string) => `${idBase}-pestana-${id}`;
  const idPanel = (id: string) => `${idBase}-panel-${id}`;

  const medir = useCallback(() => {
    const pestana = listaRef.current?.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]'
    );
    if (!pestana) return;
    setIndicador({ izquierda: pestana.offsetLeft, ancho: pestana.offsetWidth });
  }, []);

  useLayoutEffect(() => {
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [activa, pestanas, medir]);

  const manejarTeclado = (evento: KeyboardEvent<HTMLDivElement>) => {
    const indiceActual = pestanas.findIndex((p) => p.id === activa);
    const ultimo = pestanas.length - 1;
    const destinos = new Map([
      ["ArrowRight", indiceActual === ultimo ? 0 : indiceActual + 1],
      ["ArrowLeft", indiceActual === 0 ? ultimo : indiceActual - 1],
      ["Home", 0],
      ["End", ultimo],
    ]);
    const destino = destinos.get(evento.key);
    if (destino === undefined) return;
    evento.preventDefault();
    const siguiente = pestanas.at(destino);
    if (!siguiente) return;
    onCambiar(siguiente.id);
    document.getElementById(idPestana(siguiente.id))?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div
          ref={listaRef}
          role="tablist"
          aria-label={etiqueta}
          onKeyDown={manejarTeclado}
          className="relative flex w-fit max-w-full shrink-0 overflow-x-auto rounded-lg border border-borde bg-white p-1"
        >
          {indicador && (
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-0 rounded-md bg-primario shadow-sm transition-[transform,width] duration-200 ease-out"
              style={{
                width: indicador.ancho,
                transform: `translateX(${indicador.izquierda}px)`,
              }}
            />
          )}
          {pestanas.map((pestana) => {
            const seleccionada = pestana.id === activa;
            return (
              <button
                key={pestana.id}
                id={idPestana(pestana.id)}
                type="button"
                role="tab"
                aria-selected={seleccionada}
                aria-controls={idPanel(pestana.id)}
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => onCambiar(pestana.id)}
                className={cn(
                  "relative z-10 shrink-0 rounded-md px-4 py-2 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-acento",
                  seleccionada
                    ? "font-medium text-white"
                    : "text-texto-suave hover-fino:text-primario"
                )}
              >
                {pestana.etiqueta}
              </button>
            );
          })}
        </div>
        <div ref={setRanuraAcciones} className="flex items-center gap-2 empty:hidden" />
      </div>
      <RanuraAccionesContext.Provider value={ranuraAcciones}>
        <div
          key={activa}
          id={idPanel(activa)}
          role="tabpanel"
          aria-labelledby={idPestana(activa)}
          className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 duration-150"
        >
          {children}
        </div>
      </RanuraAccionesContext.Provider>
    </div>
  );
}
