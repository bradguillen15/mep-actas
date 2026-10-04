"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Selector } from "@/components/ui/Selector";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { obtenerJsonEstricto } from "@/lib/api-cliente";

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

interface TipoActa {
  id: number;
  nombre: string;
}

function BotonNuevaActa() {
  return (
    <Boton asChild variante="acento">
      <Link href="/actas/nueva">
        <Plus aria-hidden className="size-4" />
        Nueva acta
      </Link>
    </Boton>
  );
}

type ActaConTipo = Acta & { nombreTipo: string };

export default function Actas() {
  const router = useRouter();
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [escuelaFiltro, setEscuelaFiltro] = useState("");

  const params = new URLSearchParams();
  if (escuelaFiltro) params.set("escuelaId", escuelaFiltro);
  else if (escuelaId) params.set("escuelaId", String(escuelaId));

  const {
    data: actas,
    error,
    isLoading,
    mutate,
  } = useSWR<Acta[]>(`/api/actas?${params.toString()}`, obtenerJsonEstricto);
  const { data: tiposActa } = useSWR<TipoActa[]>(
    "/api/tipos-acta",
    obtenerJsonEstricto
  );

  const filas = useMemo<ActaConTipo[]>(() => {
    const nombrePorTipo = new Map(tiposActa?.map((t) => [t.id, t.nombre]));
    return (actas ?? []).map((acta) => ({
      ...acta,
      nombreTipo: nombrePorTipo.get(acta.tipoActaId) ?? "",
    }));
  }, [actas, tiposActa]);

  const columnas: ColumnDef<ActaConTipo>[] = useMemo(() => {
    return [
      {
        header: "Acta",
        accessorKey: "titulo",
        enableSorting: true,
        meta: { className: "min-w-[12rem] max-w-[20rem]" },
        cell: ({ row }) => (
          <Link
            href={`/actas/${row.original.id}`}
            onClick={(evento) => evento.stopPropagation()}
            className="block truncate rounded font-medium text-primario outline-none transition-colors duration-150 hover-fino:underline focus-visible:ring-2 focus-visible:ring-primario"
            title={row.original.titulo}
          >
            {row.original.titulo}
          </Link>
        ),
      },
      {
        header: "Tipo",
        accessorKey: "nombreTipo",
        enableSorting: true,
        meta: { className: "whitespace-nowrap" },
        cell: ({ getValue }) => {
          const nombre = getValue() as string;
          return nombre ? <Badge variante="info">{nombre}</Badge> : "—";
        },
      },
      {
        header: "Tomo",
        accessorKey: "numeroTomo",
        enableSorting: true,
        meta: { className: "w-[1%] whitespace-nowrap tabular-nums" },
      },
      {
        header: "Folios",
        id: "folios",
        accessorFn: (fila) => fila.folioInicio,
        enableSorting: true,
        meta: { className: "w-[1%] whitespace-nowrap tabular-nums" },
        cell: ({ row }) => `${row.original.folioInicio}–${row.original.folioFin}`,
      },
      {
        header: "Fecha",
        accessorKey: "fecha",
        enableSorting: true,
        meta: { className: "w-[1%] whitespace-nowrap tabular-nums" },
        cell: ({ getValue }) =>
          new Date(getValue() as string).toLocaleDateString("es-CR"),
      },
    ];
  }, []);

  const escuelaOpciones = escuelas.map((e) => ({
    valor: e.id,
    etiqueta: e.nombre,
  }));

  const descripcionVacia = escuelaFiltro
    ? "La escuela seleccionada todavía no tiene actas."
    : puedeElegirEscuela
      ? "Cuando se registren actas aparecerán aquí."
      : "Su escuela todavía no tiene actas. Cree la primera.";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <EncabezadoPagina
        titulo="Actas"
        descripcion="Consulte y administre las actas de graduación."
      />

      <div className="flex shrink-0 flex-wrap items-end gap-3">
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
        <div className="ml-auto">
          <BotonNuevaActa />
        </div>
      </div>

      {error ? (
        <EstadoVacio
          variante="error"
          mensaje="No se pudieron cargar las actas"
          descripcion="Ocurrió un problema al consultar las actas. Intente de nuevo."
          accion={
            <Boton type="button" variante="secundario" onClick={() => mutate()}>
              Reintentar
            </Boton>
          }
        />
      ) : (
        <Tabla
          columnas={columnas}
          datos={filas}
          cargando={isLoading}
          vacio={
            <EstadoVacio
              mensaje="Aún no hay actas registradas"
              descripcion={descripcionVacia}
              accion={<BotonNuevaActa />}
            />
          }
          onFilaClick={(fila) => router.push(`/actas/${fila.id}`)}
        />
      )}
    </div>
  );
}
