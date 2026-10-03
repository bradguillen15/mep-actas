"use client";

import { useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { EXTENSIONES_PERMITIDAS, extensionDeArchivo, tipoContenidoDeArchivo } from "@/lib/escaneos";
import { obtenerJsonEstricto } from "@/lib/api-cliente";
import { cn } from "@/lib/utils";
import {
  Alerta,
  Boton,
  BotonIcono,
  Campo,
  EncabezadoPagina,
  EstadoVacio,
  Esqueleto,
  Selector,
  Tarjeta,
  ZonaCarga,
  toast,
} from "@/components/ui";
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

const TAMANO_MAXIMO_MB = 20;

function ImagenFolio({ escaneo }: { escaneo: Escaneo }) {
  const [cargada, setCargada] = useState(false);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-lg bg-superficie">
      {!cargada && <Esqueleto className="absolute inset-0 rounded-none" />}
      <Image
        src={escaneo.urlLectura}
        unoptimized={escaneo.urlLectura.startsWith("/")}
        alt={`Folio ${escaneo.numeroFolio}`}
        fill
        sizes="(min-width: 768px) 768px, 100vw"
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

  const [nuevoTomo, setNuevoTomo] = useState("");
  const [nuevoFolio, setNuevoFolio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");

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

  const manejarSubida = async () => {
    if (!archivo || !nuevoTomo || !nuevoFolio || !escuelaSeleccionada) return;
    setErrorUpload("");
    setSubiendo(true);

    try {
      const ext = extensionDeArchivo(archivo.name);
      const tipoContenido = tipoContenidoDeArchivo(archivo.name);
      if (!tipoContenido) throw new Error("Tipo de archivo no permitido");
      const resPrep = await fetch("/api/escaneos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escuelaId: Number(escuelaSeleccionada),
          numeroTomo: Number(nuevoTomo),
          numeroFolio: Number(nuevoFolio),
          formato: ext,
        }),
      });

      if (!resPrep.ok) {
        const err = await resPrep.json().catch(() => ({ error: "Error al preparar subida" }));
        throw new Error(err.error ?? "Error al preparar subida");
      }

      const { urlSubida } = await resPrep.json();

      const resUpload = await fetch(urlSubida, {
        method: "PUT",
        body: archivo,
        headers: { "Content-Type": tipoContenido },
      });

      if (!resUpload.ok) throw new Error("Error al subir el archivo");

      const folioSubido = Number(nuevoFolio);
      setTomoTexto(nuevoTomo);
      setFolioElegido(folioSubido);
      setArchivo(null);
      setNuevoTomo("");
      setNuevoFolio("");
      await Promise.all([mutate(), mutarTomos()]);
      toast.success(`Folio ${folioSubido} subido`);
    } catch (e) {
      setErrorUpload(e instanceof Error ? e.message : "Error al subir archivo");
    } finally {
      setSubiendo(false);
    }
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

        {escuelaSeleccionada && cargandoTomos && (
          <Esqueleto className="h-10 w-full max-w-xl" />
        )}

        {escuelaSeleccionada && resumenTomos && resumenTomos.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-texto">Tomos con folios</p>
            <div
              role="group"
              aria-label="Tomos disponibles"
              className="flex flex-wrap gap-2"
            >
              {resumenTomos.map((tomo) => {
                const seleccionado = tomo.numeroTomo === tomoVisible;
                return (
                  <Boton
                    key={tomo.numeroTomo}
                    type="button"
                    tamano="sm"
                    variante={seleccionado ? "primario" : "secundario"}
                    aria-pressed={seleccionado}
                    onClick={() => {
                      setTomoTexto(String(tomo.numeroTomo));
                      setFolioElegido(null);
                    }}
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
          descripcion="Esta escuela aún no tiene folios. Use la sección de subida para agregar el primero."
          icono={<ImageIcon className="size-6" />}
        />
      )}

      {isLoading && <Esqueleto className="aspect-[4/3] w-full max-w-3xl self-center" />}

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
          className="flex flex-col gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2"
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
            </div>
          </div>

          <Tarjeta className="p-4">
            <ImagenFolio key={escaneoVisible.urlLectura} escaneo={escaneoVisible} />
          </Tarjeta>
        </div>
      )}

      <Tarjeta>
        <h2 className="mb-1 text-base font-semibold text-texto">Subir nuevo folio</h2>
        <p className="mb-4 text-sm text-texto-suave">
          {nombreEscuela
            ? `Escuela: ${nombreEscuela}`
            : escuelaSeleccionada
              ? "Se subirá a su escuela."
              : "Seleccione una escuela arriba para subir folios."}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo
            label="N° de tomo"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Ej: 4"
            value={nuevoTomo}
            onChange={(e) => setNuevoTomo(e.target.value)}
          />
          <Campo
            label="N° de folio"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Ej: 1"
            value={nuevoFolio}
            onChange={(e) => setNuevoFolio(e.target.value)}
          />
        </div>

        <ZonaCarga
          className="mt-4"
          archivo={archivo}
          onArchivo={setArchivo}
          extensionesPermitidas={EXTENSIONES_PERMITIDAS}
          tamanoMaximoMb={TAMANO_MAXIMO_MB}
          deshabilitada={subiendo}
        />

        {errorUpload && (
          <Alerta variante="error" className="mt-3">
            {errorUpload}
          </Alerta>
        )}

        <div className="mt-4">
          <Boton
            onClick={manejarSubida}
            disabled={!archivo || !nuevoTomo || !nuevoFolio || !escuelaSeleccionada || subiendo}
            cargando={subiendo}
          >
            {subiendo ? "Subiendo…" : "Subir folio"}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}
