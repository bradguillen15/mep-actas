"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Selector } from "@/components/ui/Selector";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { useEscuelaActual } from "../../../src/hooks/useEscuelaActual";

interface Acta {
  id: number;
  escuelaId: number;
  tipoActaId: number;
  titulo: string;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  fecha: string;
  actaReferenciaId: number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Actas() {
  const router = useRouter();
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [escuelaFiltro, setEscuelaFiltro] = useState("");
  const [tomoFiltro, _setTomoFiltro] = useState("");

  const params = new URLSearchParams();
  if (escuelaFiltro) params.set("escuelaId", escuelaFiltro);
  else if (escuelaId) params.set("escuelaId", String(escuelaId));
  if (tomoFiltro) params.set("tomo", tomoFiltro);

  const { data: actas, isLoading } = useSWR<Acta[]>(
    `/api/actas?${params.toString()}`,
    fetcher
  );

  const columnas: ColumnDef<Acta>[] = [
    {
      header: "N° de acta",
      accessorKey: "titulo",
      enableSorting: true,
    },
    {
      header: "Tomo / Folios",
      accessorFn: (row) =>
        `Tomo ${row.numeroTomo}, folios ${row.folioInicio}–${row.folioFin}`,
      id: "tomoFolios",
      enableSorting: false,
    },
    {
      header: "Fecha",
      accessorKey: "fecha",
      enableSorting: true,
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString("es-CR"),
    },
    {
      header: "Folio inicio",
      accessorKey: "folioInicio",
      enableSorting: true,
    },
    {
      header: "Folio fin",
      accessorKey: "folioFin",
      enableSorting: true,
    },
  ];

  const escuelaOpciones = escuelas.map((e) => ({
    valor: e.id,
    etiqueta: e.nombre,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-texto">Actas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulte y administre las actas de graduación.
          </p>
        </div>
        <Link href="/actas/nueva">
          <Boton>
            <Plus className="h-4 w-4" />
            Nueva acta
          </Boton>
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {puedeElegirEscuela && (
          <Selector
            label="Escuela"
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

      {!isLoading && (!actas || actas.length === 0) && (
        <EstadoVacio
          mensaje="Sin actas registradas"
          descripcion="No hay actas registradas para esta escuela."
          accion={
            <Link href="/actas/nueva">
              <Boton>
                <Plus className="h-4 w-4" />
                Nueva acta
              </Boton>
            </Link>
          }
        />
      )}

      {actas && actas.length > 0 && (
        <Tabla
          columnas={columnas}
          datos={actas}
          onFilaClick={(fila) => router.push(`/actas/${fila.id}`)}
        />
      )}
    </div>
  );
}
