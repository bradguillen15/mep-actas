"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { tipoContenidoDeExtension } from "@/lib/escaneos";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useEscuelaActual } from "../../../src/hooks/useEscuelaActual";

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Tomos() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [escuelaFiltro, setEscuelaFiltro] = useState("");
  const [tomoActivo, setTomoActivo] = useState(1);
  const [folioActual, setFolioActual] = useState(0);

  const [nuevoTomo, setNuevoTomo] = useState("");
  const [nuevoFolio, setNuevoFolio] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const escuelaSeleccionada = escuelaFiltro || (escuelaId ? String(escuelaId) : "");
  const params = new URLSearchParams({
    escuelaId: escuelaSeleccionada,
    tomo: String(tomoActivo),
  });

  const { data: escaneos, isLoading, mutate } = useSWR<Escaneo[]>(
    escuelaSeleccionada ? `/api/escaneos?${params.toString()}` : null,
    fetcher
  );

  const escaneosOrdenados = (escaneos ?? []).sort(
    (a, b) => a.numeroFolio - b.numeroFolio
  );

  const escaneoVisible = escaneosOrdenados[folioActual as number] ?? null;

  const manejarSubida = async () => {
    if (!archivo || !nuevoTomo || !nuevoFolio) return;
    setErrorUpload("");
    setSubiendo(true);

    try {
      const ext = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const resPrep = await fetch("/api/escaneos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escuelaId: Number(escuelaFiltro || escuelaId),
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
        headers: { "Content-Type": tipoContenidoDeExtension(ext) },
      });

      if (!resUpload.ok) throw new Error("Error al subir el archivo");

      setArchivo(null);
      setNuevoTomo("");
      setNuevoFolio("");
      if (inputRef.current) inputRef.current.value = "";
      mutate();
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
      <div>
        <h1 className="text-2xl font-semibold text-texto">Tomos digitalizados</h1>
        <p className="mt-1 text-sm text-gray-500">
          Explore los folios digitalizados por tomo y suba nuevas imágenes.
        </p>
      </div>

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
              setFolioActual(0);
            }}
            className="w-56"
          />
        )}
        <Campo
          label="N° de tomo"
          type="number"
          value={tomoActivo}
          onChange={(e) => {
            setTomoActivo(Number(e.target.value));
            setFolioActual(0);
          }}
          className="w-32"
        />
      </div>

      {isLoading && <Cargando />}

      {!escuelaSeleccionada && (
        <EstadoVacio
          mensaje="Seleccione una escuela"
          descripcion="Cada escuela tiene sus propios tomos y folios. Elija una escuela para explorarlos."
          icono={<ImageIcon className="h-8 w-8 text-gray-400" />}
        />
      )}

      {escuelaSeleccionada && !isLoading && escaneosOrdenados.length === 0 && (
        <EstadoVacio
          mensaje="Sin folios digitalizados"
          descripcion={`El tomo ${tomoActivo} aún no tiene folios. Use la sección de subida para agregar el primero.`}
          icono={<ImageIcon className="h-8 w-8 text-gray-400" />}
        />
      )}

      {escaneosOrdenados.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-texto">
              {escaneosOrdenados.length} folio{escaneosOrdenados.length !== 1 ? "s" : ""} en tomo {tomoActivo}
            </p>
            <div className="flex items-center gap-2">
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={folioActual <= 0}
                onClick={() => setFolioActual(folioActual - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Boton>
              <span className="text-sm text-gray-500 min-w-[80px] text-center">
                Folio {folioActual + 1} de {escaneosOrdenados.length}
              </span>
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={folioActual >= escaneosOrdenados.length - 1}
                onClick={() => setFolioActual(folioActual + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Boton>
            </div>
          </div>

          {escaneoVisible && (
            <Tarjeta className="flex items-center justify-center p-4">
              <Image
                src={escaneoVisible.urlLectura}
                unoptimized={escaneoVisible.urlLectura.startsWith("/")}
                alt={`Folio ${escaneoVisible.numeroFolio}`}
                width={800}
                height={600}
                className="max-h-[60vh] w-auto rounded-lg object-contain"
              />
            </Tarjeta>
          )}
        </div>
      )}

      <Tarjeta>
        <h2 className="text-base font-semibold text-texto mb-4">
          Subir nuevo folio
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {puedeElegirEscuela && (
            <Selector
              label="Escuela"
              opciones={[
                ...escuelaOpciones,
              ]}
              value={escuelaFiltro}
              onChange={(e) => setEscuelaFiltro(e.target.value)}
            />
          )}
          <Campo
            label="N° de tomo"
            type="number"
            placeholder="Ej: 4"
            value={nuevoTomo}
            onChange={(e) => setNuevoTomo(e.target.value)}
          />
          <Campo
            label="N° de folio"
            type="number"
            placeholder="Ej: 1"
            value={nuevoFolio}
            onChange={(e) => setNuevoFolio(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-borde bg-superficie p-8 hover:border-primario transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {archivo ? archivo.name : "Haga clic para seleccionar una imagen"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {errorUpload && (
          <div className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {errorUpload}
          </div>
        )}

        <div className="mt-4">
          <Boton
            onClick={manejarSubida}
            disabled={!archivo || !nuevoTomo || !nuevoFolio || subiendo}
            cargando={subiendo}
          >
            {subiendo ? "Subiendo..." : "Subir folio"}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}
