"use client";

import { useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Modal } from "@/components/ui/Modal";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Badge } from "@/components/ui/Badge";
import { useEscuelaActual } from "../../../src/hooks/useEscuelaActual";

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
  estudiantes: { nombre: string; identificacion: string; numeroCertificado: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Consultar() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"identificacion" | "nombre">("identificacion");
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>("");
  const [seleccionado, setSeleccionado] = useState<Graduacion | null>(null);

  const params = new URLSearchParams();
  if (busqueda) {
    params.set(tipoFiltro, busqueda);
  }
  if (escuelaFiltro) {
    params.set("escuelaId", escuelaFiltro);
  } else if (escuelaId) {
    params.set("escuelaId", String(escuelaId));
  }

  const url = busqueda ? `/api/graduaciones?${params.toString()}` : null;

  const { data: resultados, isLoading } = useSWR<Graduacion[]>(url, fetcher);

  const columnas: ColumnDef<Graduacion>[] = [
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

  const escuelaOpciones = escuelas.map((e) => ({
    valor: e.id,
    etiqueta: e.nombre,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Consultar graduados</h1>
        <p className="mt-1 text-sm text-gray-500">
          Busque por identificación o nombre para verificar si una persona se graduó.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[280px]">
          <Campo
            placeholder={
              tipoFiltro === "identificacion"
                ? "Buscar por cédula..."
                : "Buscar por nombre..."
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
      </div>

      {isLoading && <Cargando />}

      {!isLoading && resultados === undefined && (
        <EstadoVacio
          mensaje="Realice una búsqueda"
          descripcion="Ingrese una cédula o nombre para comenzar."
          icono={<Search className="h-8 w-8 text-gray-400" />}
        />
      )}

      {!isLoading && resultados !== undefined && resultados.length === 0 && (
        <EstadoVacio
          mensaje="Sin registros encontrados"
          descripcion="No se encontraron graduaciones con los criterios ingresados."
        />
      )}

      {resultados && resultados.length > 0 && (
        <Tabla
          columnas={columnas}
          datos={resultados}
          onFilaClick={(fila) => setSeleccionado(fila)}
        />
      )}

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
