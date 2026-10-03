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
  const [tomoTexto, setTomoTexto] = useState("1");
  const [folioElegido, setFolioElegido] = useState<number | null>(null);

  const [nuevoTomo, setNuevoTomo] = useState("");
  const [nuevoFolio, setNuevoFolio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");

  const escuelaSeleccionada = escuelaFiltro || (escuelaId ? String(escuelaId) : "");
  const tomoActivo = Number(tomoTexto);
  const tomoValido = Number.isInteger(tomoActivo) && tomoActivo > 0;
  const params = new URLSearchParams({
    escuelaId: escuelaSeleccionada,
    tomo: String(tomoActivo),
  });

  const { data: escaneos, isLoading, error, mutate } = useSWR<Escaneo[]>(
    escuelaSeleccionada && tomoValido ? `/api/escaneos?${params.toString()}` : null,
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
      await mutate();
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

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Tomos digitalizados"
        descripcion="Explore los folios digitalizados por tomo y suba nuevas imágenes."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
              setFolioElegido(null);
            }}
            className="w-full sm:w-56"
          />
        )}
        <Campo
          label="N° de tomo"
          type="number"
          inputMode="numeric"
          min={1}
          value={tomoTexto}
          onChange={(e) => {
            setTomoTexto(e.target.value);
            setFolioElegido(null);
          }}
          className="w-full sm:w-32"
        />
      </div>

      {isLoading && <Esqueleto className="aspect-[4/3] w-full max-w-3xl self-center" />}

      {!escuelaSeleccionada && (
        <EstadoVacio
          mensaje="Seleccione una escuela"
          descripcion="Cada escuela tiene sus propios tomos y folios. Elija una escuela para explorarlos."
          icono={<ImageIcon className="size-6" />}
        />
      )}

      {escuelaSeleccionada && error && (
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

      {escuelaSeleccionada && !isLoading && !error && escaneosOrdenados.length === 0 && (
        <EstadoVacio
          mensaje="Sin folios digitalizados"
          descripcion={`El tomo ${tomoTexto} aún no tiene folios. Use la sección de subida para agregar el primero.`}
          icono={<ImageIcon className="size-6" />}
        />
      )}

      {escaneoVisible && (
        <div
          role="group"
          aria-label="Visor de folios"
          tabIndex={0}
          onKeyDown={alPresionarTecla}
          className="flex flex-col gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primario focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-texto">
              {escaneosOrdenados.length} folio{escaneosOrdenados.length !== 1 ? "s" : ""} en tomo {tomoActivo}
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
