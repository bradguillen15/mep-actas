"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Modal } from "@/components/ui/Modal";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { BotonIcono } from "@/components/ui/BotonIcono";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { ListaDefiniciones } from "@/components/ui/ListaDefiniciones";
import { Paginacion } from "@/components/ui/Paginacion";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { obtenerJsonEstricto } from "@/lib/api-cliente";
import {
  LIMITE_PAGINA_POR_DEFECTO,
  type LimitePagina,
} from "@/lib/paginacion";
import { cn } from "@/lib/utils";

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

const ID_PANEL_AVANZADO = "panel-busqueda-avanzada";

function CeldaTruncada({ texto }: { texto: string }) {
  return (
    <span className="block max-w-[16rem] truncate" title={texto}>
      {texto}
    </span>
  );
}

export default function Consultar() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const campoBusquedaRef = useRef<HTMLInputElement>(null);
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
  const [limite, setLimite] = useState<LimitePagina>(LIMITE_PAGINA_POR_DEFECTO);

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

  const { data: tiposActa } = useSWR<TipoActa[]>(
    "/api/tipos-acta",
    obtenerJsonEstricto
  );

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
    params.set("limite", String(limite));

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
    limite,
  ]);

  const {
    data: respuesta,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<RespuestaGraduaciones>(urlConsulta, obtenerJsonEstricto, {
    keepPreviousData: true,
  });

  const resultados = respuesta?.datos ?? [];
  const cargaInicial = isLoading && !respuesta;

  const buscando =
    busqueda !== busquedaDebounced ||
    tipoActaFiltro !== tipoActaDebounced ||
    fechaDesde !== fechaDesdeDebounced ||
    fechaHasta !== fechaHastaDebounced ||
    numeroCertificado !== numeroCertificadoDebounced ||
    tituloActa !== tituloActaDebounced;
  const actualizando = isValidating || buscando;

  const filtrosAvanzadosActivos = [
    tipoActaFiltro,
    fechaDesde,
    fechaHasta,
    numeroCertificado,
    tituloActa,
  ].filter(Boolean).length;
  const hayFiltros =
    busqueda !== "" || escuelaFiltro !== "" || filtrosAvanzadosActivos > 0;

  const columnas: ColumnDef<Graduacion>[] = useMemo(
    () => [
      {
        header: "Nombre completo",
        accessorKey: "nombreCompleto",
        enableSorting: true,
        cell: ({ getValue }) => <CeldaTruncada texto={getValue() as string} />,
      },
      {
        header: "Identificación",
        accessorKey: "identificacion",
        enableSorting: true,
        meta: { className: "tabular-nums" },
      },
      {
        header: "Escuela",
        accessorKey: "escuela",
        enableSorting: true,
        cell: ({ getValue }) => <CeldaTruncada texto={getValue() as string} />,
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
        meta: { className: "tabular-nums" },
        cell: ({ getValue }) =>
          new Date(getValue() as string).toLocaleDateString("es-CR"),
      },
      {
        header: "N° certificado",
        accessorKey: "numeroCertificado",
        enableSorting: true,
        meta: { className: "text-right tabular-nums [&>button]:justify-end" },
      },
    ],
    []
  );

  const indiceInicio = respuesta
    ? (respuesta.pagina - 1) * respuesta.limite
    : 0;

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

  const limpiarTodo = () => {
    setBusqueda("");
    setEscuelaFiltro("");
    limpiarAvanzados();
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    campoBusquedaRef.current?.focus();
  };

  const estadoVacio = (
    <EstadoVacio
      mensaje="Sin registros encontrados"
      descripcion={
        hayFiltros
          ? "No se encontraron graduaciones con los criterios ingresados."
          : "No hay graduados registrados todavía."
      }
      accion={
        hayFiltros ? (
          <Boton type="button" variante="secundario" onClick={limpiarTodo}>
            Limpiar filtros
          </Boton>
        ) : undefined
      }
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <EncabezadoPagina
        titulo="Consultar graduados"
        descripcion="Vea los graduados registrados recientemente o busque por identificación, nombre u otros criterios."
      />

      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[280px] flex-1 items-stretch rounded-lg border border-borde bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-primario focus-within:ring-2 focus-within:ring-primario/20">
            <div className="relative">
              <select
                aria-label="Criterio de búsqueda"
                value={tipoFiltro}
                onChange={(e) =>
                  setTipoFiltro(e.target.value as "identificacion" | "nombre")
                }
                className="h-full appearance-none rounded-l-lg bg-transparent pr-8 pl-3 text-sm text-texto outline-none"
              >
                <option value="identificacion">Cédula</option>
                <option value="nombre">Nombre</option>
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-texto-suave"
              />
            </div>
            <div aria-hidden className="my-2 w-px bg-borde" />
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave"
              />
              <input
                ref={campoBusquedaRef}
                type="text"
                aria-label="Buscar graduados"
                placeholder={
                  tipoFiltro === "identificacion"
                    ? "Buscar por cédula (coincidencias parciales)..."
                    : "Buscar por nombre o apellido..."
                }
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-full w-full rounded-r-lg bg-transparent pr-10 pl-9 text-sm text-texto outline-none placeholder:text-texto-suave"
              />
              {busqueda && (
                <BotonIcono
                  etiqueta="Limpiar búsqueda"
                  tamano="sm"
                  onClick={limpiarBusqueda}
                  icono={<X aria-hidden />}
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                />
              )}
            </div>
          </div>
          {puedeElegirEscuela && (
            <Selector
              aria-label="Escuela"
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
            aria-expanded={avanzadaAbierta}
            aria-controls={ID_PANEL_AVANZADO}
            onClick={() => setAvanzadaAbierta((abierta) => !abierta)}
            className="gap-2"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            Búsqueda avanzada
            {filtrosAvanzadosActivos > 0 && (
              <Badge variante="info">{String(filtrosAvanzadosActivos)}</Badge>
            )}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 transition-transform duration-150 ease-out",
                avanzadaAbierta && "rotate-180"
              )}
            />
          </Boton>
        </div>

        {avanzadaAbierta && (
          <div
            id={ID_PANEL_AVANZADO}
            className="animate-in rounded-xl border border-borde bg-white p-4 duration-200 fade-in-0 slide-in-from-top-1"
          >
            <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-texto">
                Filtros avanzados
              </h2>
              {filtrosAvanzadosActivos > 0 && (
                <Boton
                  type="button"
                  variante="ghost"
                  tamano="sm"
                  onClick={limpiarAvanzados}
                >
                  Limpiar filtros
                </Boton>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="md:col-span-2">
                <Campo
                  label="Título del acta"
                  placeholder="Buscar por título..."
                  value={tituloActa}
                  onChange={(e) => setTituloActa(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <div
          aria-hidden
          className={cn(
            "absolute inset-x-0 -top-1 z-10 h-0.5 animate-pulse rounded-full bg-acento transition-opacity duration-150",
            actualizando ? "opacity-100" : "opacity-0"
          )}
        />
        {error ? (
          <EstadoVacio
            variante="error"
            mensaje="No se pudo cargar la información"
            descripcion="Ocurrió un problema al consultar los graduados. Intente de nuevo."
            accion={
              <Boton type="button" variante="secundario" onClick={() => mutate()}>
                Reintentar
              </Boton>
            }
          />
        ) : (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-borde bg-white transition-opacity duration-150",
              actualizando && !cargaInicial && "opacity-60"
            )}
          >
            <Tabla
              columnas={columnas}
              datos={resultados}
              cargando={cargaInicial}
              vacio={estadoVacio}
              onFilaClick={(fila) => setSeleccionado(fila)}
              paginacion={false}
              indiceInicio={indiceInicio}
              className="rounded-none border-0"
            />
            {respuesta && resultados.length > 0 && (
              <div className="shrink-0">
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
                  onLimiteChange={(nuevoLimite) => {
                    setLimite(nuevoLimite as LimitePagina);
                    setPagina(1);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        abierto={seleccionado !== null}
        onCerrar={() => setSeleccionado(null)}
        titulo="Detalle de graduación"
        tamano="lg"
        pie={
          seleccionado?.actaId ? (
            <Boton asChild variante="secundario">
              <Link href={`/actas/${seleccionado.actaId}`}>Ver acta</Link>
            </Boton>
          ) : undefined
        }
      >
        {seleccionado && (
          <ListaDefiniciones
            elementos={[
              { etiqueta: "Nombre completo", valor: seleccionado.nombreCompleto },
              { etiqueta: "Identificación", valor: seleccionado.identificacion },
              { etiqueta: "Escuela", valor: seleccionado.escuela },
              {
                etiqueta: "Tipo de acta",
                valor: <Badge variante="info">{seleccionado.tipoActa}</Badge>,
              },
              {
                etiqueta: "Fecha",
                valor: new Date(seleccionado.fecha).toLocaleDateString("es-CR"),
              },
              {
                etiqueta: "N° certificado",
                valor: seleccionado.numeroCertificado,
              },
              { etiqueta: "Acta", valor: seleccionado.tituloActa },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
