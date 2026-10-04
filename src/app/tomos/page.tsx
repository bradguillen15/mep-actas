"use client";

import { useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, Plus } from "lucide-react";
import Image from "next/image";
import { obtenerJsonEstricto } from "@/lib/api-cliente";
import { cn } from "@/lib/utils";
import {
  Boton,
  BotonIcono,
  EncabezadoPagina,
  EstadoVacio,
  Esqueleto,
  Selector,
  Tarjeta,
  toast,
} from "@/components/ui";
import { FilaTomos } from "@/components/tomos/FilaTomos";
import { ModalNuevoFolio } from "@/components/tomos/ModalNuevoFolio";
import { VisorPantallaCompleta } from "@/components/tomos/VisorPantallaCompleta";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";

interface Escaneo {
  id: number;
  escuelaId: number;
  numeroTomo: number;
  numeroFolio: number;
  url: string;
  urlLectura: string;
  formato: string;
  createdAt: string;
}

interface ResumenTomo {
  numeroTomo: number;
  cantidadFolios: number;
}

function ImagenFolio({ escaneo }: { escaneo: Escaneo }) {
  const [cargada, setCargada] = useState(false);

  return (
    <div className="relative min-h-64 w-full flex-1 overflow-hidden rounded-lg bg-superficie">
      {!cargada && <Esqueleto className="absolute inset-0 rounded-none" />}
      <Image
        src={escaneo.urlLectura}
        unoptimized={escaneo.urlLectura.startsWith("/")}
        alt={`Folio ${escaneo.numeroFolio}`}
        fill
        sizes="(min-width: 1024px) 1024px, 100vw"
        onLoad={() => setCargada(true)}
        className={cn(
          "object-contain transition-opacity duration-200",
          cargada ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

export default function Tomos() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [escuelaFiltro, setEscuelaFiltro] = useState("");
  const [tomoTexto, setTomoTexto] = useState("");
  const [folioElegido, setFolioElegido] = useState<number | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const escuelaSeleccionada = escuelaFiltro || (escuelaId ? String(escuelaId) : "");
  const tomoActivo = Number(tomoTexto);
  const tomoValido = Number.isInteger(tomoActivo) && tomoActivo > 0;

  const {
    data: resumenTomos,
    isLoading: cargandoTomos,
    error: errorTomos,
    mutate: mutarTomos,
  } = useSWR<ResumenTomo[]>(
    escuelaSeleccionada
      ? `/api/escaneos/tomos?escuelaId=${escuelaSeleccionada}`
      : null,
    obtenerJsonEstricto
  );

  const tomoParaConsulta =
    resumenTomos && resumenTomos.length > 0
      ? resumenTomos.some((t) => t.numeroTomo === tomoActivo)
        ? tomoActivo
        : resumenTomos[0].numeroTomo
      : null;

  const params = new URLSearchParams({
    escuelaId: escuelaSeleccionada,
    tomo: String(tomoParaConsulta ?? ""),
  });

  const { data: escaneos, isLoading, error, mutate } = useSWR<Escaneo[]>(
    escuelaSeleccionada && tomoParaConsulta
      ? `/api/escaneos?${params.toString()}`
      : null,
    obtenerJsonEstricto
  );

  const escaneosOrdenados = [...(escaneos ?? [])].sort(
    (a, b) => a.numeroFolio - b.numeroFolio
  );

  const indiceElegido = escaneosOrdenados.findIndex(
    (e) => e.numeroFolio === folioElegido
  );
  const folioActual = indiceElegido >= 0 ? indiceElegido : 0;
  const escaneoVisible = escaneosOrdenados.at(folioActual) ?? null;
  const tomoVisible = tomoParaConsulta ?? (tomoValido ? tomoActivo : null);

  const irAFolio = (indice: number) => {
    const destino = indice >= 0 ? escaneosOrdenados.at(indice) : undefined;
    if (destino) setFolioElegido(destino.numeroFolio);
  };

  const alPresionarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === "ArrowLeft" && folioActual > 0) {
      evento.preventDefault();
      irAFolio(folioActual - 1);
    }
    if (evento.key === "ArrowRight" && folioActual < escaneosOrdenados.length - 1) {
      evento.preventDefault();
      irAFolio(folioActual + 1);
    }
  };

  const nombreEscuela = escuelas.find((e) => String(e.id) === escuelaSeleccionada)?.nombre;

  const alSubirFolio = async (tomo: number, folio: number) => {
    setTomoTexto(String(tomo));
    setFolioElegido(folio);
    await Promise.all([mutate(), mutarTomos()]);
    toast.success(`Folio ${folio} subido`);
  };

  const escuelaOpciones = escuelas.map((e) => ({
    valor: e.id,
    etiqueta: e.nombre,
  }));

  const sinTomos =
    escuelaSeleccionada &&
    !cargandoTomos &&
    !errorTomos &&
    Array.isArray(resumenTomos) &&
    resumenTomos.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <EncabezadoPagina
        titulo="Tomos digitalizados"
        descripcion="Explore los folios digitalizados por tomo y suba nuevas imágenes."
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {puedeElegirEscuela && (
            <Selector
              label="Escuela"
              opciones={[
                { valor: "", etiqueta: "Seleccione escuela" },
                ...escuelaOpciones,
              ]}
              value={escuelaFiltro}
              onChange={(e) => {
                setEscuelaFiltro(e.target.value);
                setTomoTexto("");
                setFolioElegido(null);
              }}
              className="w-full sm:w-56"
            />
          )}
          <Boton
            type="button"
            variante="acento"
            onClick={() => setModalAbierto(true)}
            disabled={!escuelaSeleccionada}
            className="ml-auto"
          >
            <Plus aria-hidden className="size-4" />
            Nuevo folio
          </Boton>
        </div>

        {escuelaSeleccionada && cargandoTomos && (
          <Esqueleto className="h-10 w-full max-w-xl" />
        )}

        {escuelaSeleccionada && resumenTomos && resumenTomos.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-texto">Tomos con folios</p>
            <FilaTomos
              tomos={resumenTomos}
              tomoSeleccionado={tomoVisible}
              onElegir={(numeroTomo) => {
                setTomoTexto(String(numeroTomo));
                setFolioElegido(null);
              }}
            />
          </div>
        )}
      </div>

      {!escuelaSeleccionada && (
        <EstadoVacio
          mensaje="Seleccione una escuela"
          descripcion="Cada escuela tiene sus propios tomos y folios. Elija una escuela para explorarlos."
          icono={<ImageIcon className="size-6" />}
        />
      )}

      {escuelaSeleccionada && errorTomos && (
        <EstadoVacio
          variante="error"
          mensaje="No se pudieron cargar los tomos"
          descripcion="Revise su conexión e intente de nuevo."
          accion={
            <Boton variante="secundario" onClick={() => mutarTomos()}>
              Reintentar
            </Boton>
          }
        />
      )}

      {sinTomos && (
        <EstadoVacio
          mensaje="Sin tomos digitalizados"
          descripcion="Esta escuela aún no tiene folios. Use el botón Nuevo folio para agregar el primero."
          icono={<ImageIcon className="size-6" />}
        />
      )}

      {isLoading && <Esqueleto className="min-h-64 w-full flex-1" />}

      {escuelaSeleccionada && tomoParaConsulta && error && (
        <EstadoVacio
          variante="error"
          mensaje="No se pudieron cargar los folios"
          descripcion="Revise su conexión e intente de nuevo."
          accion={
            <Boton variante="secundario" onClick={() => mutate()}>
              Reintentar
            </Boton>
          }
        />
      )}

      {escaneoVisible && tomoVisible && (
        <div
          role="group"
          aria-label="Visor de folios"
          tabIndex={0}
          onKeyDown={alPresionarTecla}
          className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-texto">
              {escaneosOrdenados.length} folio
              {escaneosOrdenados.length !== 1 ? "s" : ""} en tomo {tomoVisible}
            </p>
            <div className="flex items-center gap-2">
              <BotonIcono
                etiqueta="Folio anterior"
                icono={<ChevronLeft />}
                disabled={folioActual <= 0}
                onClick={() => irAFolio(folioActual - 1)}
              />
              <span
                aria-live="polite"
                className="min-w-24 text-center text-sm tabular-nums text-texto-suave"
              >
                Folio {folioActual + 1} de {escaneosOrdenados.length}
              </span>
              <BotonIcono
                etiqueta="Folio siguiente"
                icono={<ChevronRight />}
                disabled={folioActual >= escaneosOrdenados.length - 1}
                onClick={() => irAFolio(folioActual + 1)}
              />
              <BotonIcono
                etiqueta="Ver en pantalla completa"
                icono={<Maximize2 />}
                onClick={() => setPantallaCompleta(true)}
              />
            </div>
          </div>

          <Tarjeta className="flex min-h-0 flex-1 flex-col p-3">
            <ImagenFolio key={escaneoVisible.urlLectura} escaneo={escaneoVisible} />
          </Tarjeta>

          <VisorPantallaCompleta
            abierto={pantallaCompleta}
            onCerrar={() => setPantallaCompleta(false)}
            urlImagen={escaneoVisible.urlLectura}
            titulo={`Tomo ${tomoVisible} · Folio ${escaneoVisible.numeroFolio}`}
            hayAnterior={folioActual > 0}
            haySiguiente={folioActual < escaneosOrdenados.length - 1}
            onAnterior={() => irAFolio(folioActual - 1)}
            onSiguiente={() => irAFolio(folioActual + 1)}
          />
        </div>
      )}

      <ModalNuevoFolio
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        escuelaId={escuelaSeleccionada}
        nombreEscuela={nombreEscuela}
        onSubido={alSubirFolio}
      />
    </div>
  );
}
