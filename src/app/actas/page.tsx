"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Tabla } from "@/components/ui/Tabla";
import { Selector } from "@/components/ui/Selector";
import { Modal } from "@/components/ui/Modal";
import { Boton } from "@/components/ui/Boton";
import { Cargando } from "@/components/ui/Cargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Badge } from "@/components/ui/Badge";
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

interface ActaEstudiante {
  id: number;
  actaId: number;
  estudianteId: number;
  numeroCertificado: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
}

interface ActaFirmante {
  id: number;
  actaId: number;
  funcionarioId: number;
  rolFirma: string;
  nombres: string;
  apellidos: string;
  puesto: string;
}

interface ActaDetalle {
  acta: Acta;
  estudiantes: ActaEstudiante[];
  firmantes: ActaFirmante[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Actas() {
  const { escuelaId, escuelas, puedeElegirEscuela } = useEscuelaActual();
  const [escuelaFiltro, setEscuelaFiltro] = useState("");
  const [tomoFiltro, _setTomoFiltro] = useState("");
  const [detalleId, setDetalleId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (escuelaFiltro) params.set("escuelaId", escuelaFiltro);
  else if (escuelaId) params.set("escuelaId", String(escuelaId));
  if (tomoFiltro) params.set("tomo", tomoFiltro);

  const { data: actas, isLoading } = useSWR<Acta[]>(
    `/api/actas?${params.toString()}`,
    fetcher
  );

  const { data: detalle } = useSWR<ActaDetalle>(
    detalleId ? `/api/actas/${detalleId}` : null,
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
      accessorFn: (row) => `Tomo ${row.numeroTomo}, folios ${row.folioInicio}–${row.folioFin}`,
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

  const numEstudiantes = detalle?.estudiantes?.length ?? 0;
  const numFirmantes = detalle?.firmantes?.length ?? 0;

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
          onFilaClick={(fila) => setDetalleId(fila.id)}
        />
      )}

      <Modal
        abierto={detalleId !== null}
        onCerrar={() => setDetalleId(null)}
        titulo="Detalle de acta"
        tamano="xl"
      >
        {detalle && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Título
                </label>
                <p className="text-sm text-texto">{detalle.acta.titulo}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Fecha
                </label>
                <p className="text-sm text-texto">
                  {new Date(detalle.acta.fecha).toLocaleDateString("es-CR")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Tomo
                </label>
                <p className="text-sm text-texto">{detalle.acta.numeroTomo}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Folios
                </label>
                <p className="text-sm text-texto">
                  {detalle.acta.folioInicio} – {detalle.acta.folioFin}
                </p>
              </div>
              {detalle.acta.actaReferenciaId && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">
                    Acta de referencia
                  </label>
                  <p className="text-sm text-primario">
                    #{detalle.acta.actaReferenciaId}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-texto">
                Estudiantes ({numEstudiantes})
              </h3>
              {numEstudiantes === 0 ? (
                <p className="text-sm text-gray-500">
                  Sin estudiantes asociados.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-borde">
                  <table className="w-full text-sm">
                    <thead className="bg-superficie">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Identificación
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          N° certificado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.estudiantes.map((est) => (
                        <tr
                          key={est.id}
                          className="border-t border-borde"
                        >
                          <td className="px-3 py-2">
                            {est.nombres} {est.apellidos}
                          </td>
                          <td className="px-3 py-2">{est.identificacion}</td>
                          <td className="px-3 py-2">
                            {est.numeroCertificado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-texto">
                Firmantes ({numFirmantes})
              </h3>
              {numFirmantes === 0 ? (
                <p className="text-sm text-gray-500">
                  Sin firmantes registrados.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-borde">
                  <table className="w-full text-sm">
                    <thead className="bg-superficie">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Puesto
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Rol de firma
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.firmantes.map((f) => (
                        <tr key={f.id} className="border-t border-borde">
                          <td className="px-3 py-2">
                            {f.nombres} {f.apellidos}
                          </td>
                          <td className="px-3 py-2">{f.puesto}</td>
                          <td className="px-3 py-2">
                            <Badge variante="neutral">{f.rolFirma}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
