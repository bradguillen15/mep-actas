"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, Search, X } from "lucide-react";
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

interface RespuestaGraduaciones {
  datos: Graduacion[];
  total: number;
  pagina: number;
  limite: number;
}

const TEXTO_AYUDA_BUSQUEDA =
  "Busca a la vez en cédula, nombre, tipo de acta, número de certificado y título del acta.";

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
  const [escuelaFiltro, setEscuelaFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [seleccionado, setSeleccionado] = useState<Graduacion | null>(null);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState<LimitePagina>(LIMITE_PAGINA_POR_DEFECTO);

  const busquedaDebounced = useDebouncedValue(busqueda, 300);
  const fechaDesdeDebounced = useDebouncedValue(fechaDesde, 300);
  const fechaHastaDebounced = useDebouncedValue(fechaHasta, 300);

  const filtrosActuales = [
    busquedaDebounced,
    escuelaFiltro,
    escuelaId,
    fechaDesdeDebounced,
    fechaHastaDebounced,
  ].join("|");
  const [filtrosPrevios, setFiltrosPrevios] = useState(filtrosActuales);
  if (filtrosPrevios !== filtrosActuales) {
    setFiltrosPrevios(filtrosActuales);
    setPagina(1);
  }

  const urlConsulta = useMemo(() => {
    const params = new URLSearchParams();

    if (busquedaDebounced) {
      params.set("busqueda", busquedaDebounced);
    }

    if (escuelaFiltro) {
      params.set("escuelaId", escuelaFiltro);
    } else if (escuelaId) {
      params.set("escuelaId", String(escuelaId));
    }

    if (fechaDesdeDebounced) {
      params.set("fechaDesde", fechaDesdeDebounced);
    }
    if (fechaHastaDebounced) {
      params.set("fechaHasta", fechaHastaDebounced);
    }

    params.set("pagina", String(pagina));
    params.set("limite", String(limite));

    return `/api/graduaciones?${params.toString()}`;
  }, [
    busquedaDebounced,
    escuelaFiltro,
    escuelaId,
    fechaDesdeDebounced,
    fechaHastaDebounced,
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
    fechaDesde !== fechaDesdeDebounced ||
    fechaHasta !== fechaHastaDebounced;
  const actualizando = isValidating || buscando;

  const hayFiltros =
    busqueda !== "" ||
    escuelaFiltro !== "" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

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

  const limpiarTodo = () => {
    setBusqueda("");
    setEscuelaFiltro("");
    setFechaDesde("");
    setFechaHasta("");
    campoBusquedaRef.current?.focus();
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
        descripcion="Vea los graduados registrados recientemente o busque por cédula, nombre u otros datos del acta."
      />

      <div className="flex shrink-0 flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1">
            <label
              htmlFor="busqueda-graduados"
              className="text-sm font-medium text-texto"
            >
              Búsqueda avanzada
            </label>
            <BotonIcono
              etiqueta={TEXTO_AYUDA_BUSQUEDA}
              tamano="sm"
              icono={<Info aria-hidden />}
            />
          </div>
          <div className="relative flex h-10 items-stretch rounded-lg border border-borde bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-primario focus-within:ring-2 focus-within:ring-primario/20">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave"
            />
            <input
              ref={campoBusquedaRef}
              id="busqueda-graduados"
              type="text"
              aria-label="Búsqueda avanzada"
              placeholder="Cédula, nombre, tipo, certificado o título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-full w-full rounded-lg bg-transparent pr-10 pl-9 text-sm text-texto outline-none placeholder:text-texto-suave"
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

        <div className="flex flex-wrap items-end gap-3">
          {puedeElegirEscuela && (
            <div className="w-full sm:w-72">
              <Selector
                label="Escuela"
                opciones={[
                  { valor: "", etiqueta: "Todas las escuelas" },
                  ...escuelaOpciones,
                ]}
                value={escuelaFiltro}
                onChange={(e) => setEscuelaFiltro(e.target.value)}
              />
            </div>
          )}
          <div className="w-40">
            <Campo
              label="Fecha desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Campo
              label="Fecha hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          {hayFiltros && (
            <Boton
              type="button"
              variante="ghost"
              tamano="sm"
              onClick={limpiarTodo}
              className="mb-0.5"
            >
              Limpiar filtros
            </Boton>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
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
