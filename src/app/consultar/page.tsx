"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Modal } from "@/components/ui/Modal";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { Paginacion } from "@/components/ui/Paginacion";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LIMITE_GRADUACIONES_POR_PAGINA } from "@/lib/graduaciones";

interface Graduacion {
  id: number;
  nombreCompleto: string;
  identificacion: string;
  escuela: string;
  tipoActa: string;
  fecha: string;
  numeroCertificado: number;
  actaId: number;
  tituloActa: string;
}

interface TipoActa {
  id: number;
  nombre: string;
}

interface RespuestaGraduaciones {
  datos: Graduacion[];
  total: number;
  pagina: number;
  limite: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Consultar() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"identificacion" | "nombre">(
    "identificacion"
  );
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>("");
  const [avanzadaAbierta, setAvanzadaAbierta] = useState(false);
  const [tipoActaFiltro, setTipoActaFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [numeroCertificado, setNumeroCertificado] = useState("");
  const [tituloActa, setTituloActa] = useState("");
  const [seleccionado, setSeleccionado] = useState<Graduacion | null>(null);
  const [pagina, setPagina] = useState(1);

  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const tipoActaDebounced = useDebouncedValue(tipoActaFiltro, 300);
  const fechaDesdeDebounced = useDebouncedValue(fechaDesde, 300);
  const fechaHastaDebounced = useDebouncedValue(fechaHasta, 300);
  const numeroCertificadoDebounced = useDebouncedValue(numeroCertificado, 300);
  const tituloActaDebounced = useDebouncedValue(tituloActa, 300);

  const filtrosActuales = [
    busquedaDebounced,
    tipoFiltro,
    escuelaFiltro,
    escuelaId,
    tipoActaDebounced,
    fechaDesdeDebounced,
    fechaHastaDebounced,
    numeroCertificadoDebounced,
    tituloActaDebounced,
  ].join("|");
  const [filtrosPrevios, setFiltrosPrevios] = useState(filtrosActuales);
  if (filtrosPrevios !== filtrosActuales) {
    setFiltrosPrevios(filtrosActuales);
    setPagina(1);
  }

  const { data: tiposActa } = useSWR<TipoActa[]>("/api/tipos-acta", fetcher);

  const urlConsulta = useMemo(() => {
    const params = new URLSearchParams();

    if (busquedaDebounced) {
      params.set(tipoFiltro, busquedaDebounced);
    }

    if (escuelaFiltro) {
      params.set("escuelaId", escuelaFiltro);
    } else if (escuelaId) {
      params.set("escuelaId", String(escuelaId));
    }

    if (tipoActaDebounced) {
      params.set("tipoActaId", tipoActaDebounced);
    }
    if (fechaDesdeDebounced) {
      params.set("fechaDesde", fechaDesdeDebounced);
    }
    if (fechaHastaDebounced) {
      params.set("fechaHasta", fechaHastaDebounced);
    }
    if (numeroCertificadoDebounced) {
      params.set("numeroCertificado", numeroCertificadoDebounced);
    }
    if (tituloActaDebounced) {
      params.set("tituloActa", tituloActaDebounced);
    }

    params.set("pagina", String(pagina));
    params.set("limite", String(LIMITE_GRADUACIONES_POR_PAGINA));

    return `/api/graduaciones?${params.toString()}`;
  }, [
    busquedaDebounced,
    tipoFiltro,
    escuelaFiltro,
    escuelaId,
    tipoActaDebounced,
    fechaDesdeDebounced,
    fechaHastaDebounced,
    numeroCertificadoDebounced,
    tituloActaDebounced,
    pagina,
  ]);

  const { data: respuesta, isLoading, isValidating } = useSWR<RespuestaGraduaciones>(
    urlConsulta,
    fetcher
  );

  const resultados = respuesta?.datos ?? [];
  const cargaInicial = isLoading && !respuesta;

  const buscando =
    busqueda !== busquedaDebounced ||
    tipoActaFiltro !== tipoActaDebounced ||
    fechaDesde !== fechaDesdeDebounced ||
    fechaHasta !== fechaHastaDebounced ||
    numeroCertificado !== numeroCertificadoDebounced ||
    tituloActa !== tituloActaDebounced;

  const columnas: ColumnDef<Graduacion>[] = useMemo(() => {
    const indiceBase = respuesta
      ? (respuesta.pagina - 1) * respuesta.limite
      : 0;

    return [
    {
      id: "indice",
      header: "#",
      enableSorting: false,
      size: 48,
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-500">
          {indiceBase + row.index + 1}
        </span>
      ),
    },
    {
      header: "Nombre completo",
      accessorKey: "nombreCompleto",
      enableSorting: true,
    },
    {
      header: "Identificación",
      accessorKey: "identificacion",
      enableSorting: true,
    },
    {
      header: "Escuela",
      accessorKey: "escuela",
      enableSorting: true,
    },
    {
      header: "Tipo",
      accessorKey: "tipoActa",
      enableSorting: true,
      cell: ({ getValue }) => (
        <Badge variante="info">{getValue() as string}</Badge>
      ),
    },
    {
      header: "Fecha",
      accessorKey: "fecha",
      enableSorting: true,
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString("es-CR"),
    },
    {
      header: "N° certificado",
      accessorKey: "numeroCertificado",
      enableSorting: true,
    },
  ];
  }, [respuesta]);

  const escuelaOpciones = escuelas.map((e) => ({
    valor: e.id,
    etiqueta: e.nombre,
  }));

  const tipoActaOpciones =
    tiposActa?.map((tipo) => ({
      valor: tipo.id,
      etiqueta: tipo.nombre,
    })) ?? [];

  const limpiarAvanzados = () => {
    setTipoActaFiltro("");
    setFechaDesde("");
    setFechaHasta("");
    setNumeroCertificado("");
    setTituloActa("");
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold text-texto">Consultar graduados</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vea los graduados registrados recientemente o busque por identificación,
          nombre u otros criterios.
        </p>
      </div>

      <div className="flex-shrink-0 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px] flex-1">
            <Campo
              placeholder={
                tipoFiltro === "identificacion"
                  ? "Buscar por cédula (coincidencias parciales)..."
                  : "Buscar por nombre o apellido..."
              }
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Selector
            opciones={[
              { valor: "identificacion", etiqueta: "Cédula" },
              { valor: "nombre", etiqueta: "Nombre" },
            ]}
            value={tipoFiltro}
            onChange={(e) =>
              setTipoFiltro(e.target.value as "identificacion" | "nombre")
            }
            className="w-36"
          />
          {puedeElegirEscuela && (
            <Selector
              opciones={[
                { valor: "", etiqueta: "Todas las escuelas" },
                ...escuelaOpciones,
              ]}
              value={escuelaFiltro}
              onChange={(e) => setEscuelaFiltro(e.target.value)}
              className="w-56"
            />
          )}
          <Boton
            type="button"
            variante="secundario"
            onClick={() => setAvanzadaAbierta((abierta) => !abierta)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Búsqueda avanzada
            {avanzadaAbierta ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Boton>
        </div>

        {avanzadaAbierta && (
          <div className="grid gap-3 rounded-xl border border-borde bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
            <Selector
              label="Tipo de acta"
              opciones={[
                { valor: "", etiqueta: "Todos los tipos" },
                ...tipoActaOpciones,
              ]}
              value={tipoActaFiltro}
              onChange={(e) => setTipoActaFiltro(e.target.value)}
            />
            <Campo
              label="Fecha desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
            <Campo
              label="Fecha hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
            <Campo
              label="N° certificado"
              placeholder="Ej. 5001"
              value={numeroCertificado}
              onChange={(e) => setNumeroCertificado(e.target.value)}
            />
            <Campo
              label="Título del acta"
              placeholder="Buscar por título..."
              value={tituloActa}
              onChange={(e) => setTituloActa(e.target.value)}
              className="md:col-span-2"
            />
            <div className="flex items-end md:col-span-2 xl:col-span-3">
              <Boton type="button" variante="secundario" onClick={limpiarAvanzados}>
                Limpiar filtros avanzados
              </Boton>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {(cargaInicial || buscando) && <Cargando />}

        {!cargaInicial &&
          !buscando &&
          respuesta &&
          resultados.length === 0 && (
            <EstadoVacio
              mensaje="Sin registros encontrados"
              descripcion={
                busquedaDebounced ||
                tipoActaDebounced ||
                fechaDesdeDebounced ||
                fechaHastaDebounced ||
                numeroCertificadoDebounced ||
                tituloActaDebounced
                  ? "No se encontraron graduaciones con los criterios ingresados."
                  : "No hay graduados registrados todavía."
              }
            />
          )}

        {!cargaInicial &&
          !buscando &&
          respuesta &&
          resultados.length > 0 && (
            <div
              className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-borde bg-white ${
                isValidating ? "opacity-60" : ""
              }`}
            >
              <div className="min-h-0 flex-1 overflow-auto">
                <Tabla
                  columnas={columnas}
                  datos={resultados}
                  onFilaClick={(fila) => setSeleccionado(fila)}
                  paginacion={false}
                  className="rounded-none border-0"
                />
              </div>
              <Paginacion
                pagina={respuesta.pagina}
                totalPaginas={Math.max(
                  1,
                  Math.ceil(respuesta.total / respuesta.limite)
                )}
                totalRegistros={respuesta.total}
                limite={respuesta.limite}
                registrosEnPagina={resultados.length}
                onChange={setPagina}
              />
            </div>
          )}
      </div>

      <Modal
        abierto={seleccionado !== null}
        onCerrar={() => setSeleccionado(null)}
        titulo="Detalle de graduación"
        tamano="lg"
      >
        {seleccionado && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Nombre completo
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.nombreCompleto}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Identificación
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.identificacion}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Escuela
                </label>
                <p className="text-sm text-texto">{seleccionado.escuela}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Tipo de acta
                </label>
                <Badge variante="info">{seleccionado.tipoActa}</Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Fecha
                </label>
                <p className="text-sm text-texto">
                  {new Date(seleccionado.fecha).toLocaleDateString("es-CR")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  N° certificado
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.numeroCertificado}
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">
                  Acta
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.tituloActa}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
