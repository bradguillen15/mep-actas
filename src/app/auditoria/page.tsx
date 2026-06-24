"use client";

import { useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert } from "lucide-react";
import { Tabla } from "../../../components/ui/Tabla";
import { Modal } from "../../../components/ui/Modal";
import { Cargando } from "../../../components/ui/Cargando";
import { EstadoVacio } from "../../../components/ui/EstadoVacio";
import { Badge } from "../../../components/ui/Badge";
import { useSesion } from "../../../src/hooks/useSesion";

interface RegistroAuditoria {
  id: number;
  usuarioId: number;
  usuarioEmail: string;
  tabla: string;
  registroId: number;
  accion: string;
  datosAnteriores: string | null;
  datosNuevos: string | null;
  createdAt: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403) throw new Error("No tiene permisos para ver la auditoría");
    throw new Error("Error al cargar auditoría");
  }
  return res.json();
};

const badgeAccion: Record<string, "info" | "exito" | "advertencia" | "error"> = {
  crear: "exito",
  actualizar: "advertencia",
  desactivar: "error",
  agregar_estudiante: "info",
};

export default function Auditoria() {
  const { usuario } = useSesion();
  const [seleccionado, setSeleccionado] = useState<RegistroAuditoria | null>(
    null
  );

  const { data: registros, isLoading, error } = useSWR<RegistroAuditoria[]>(
    "/api/auditoria",
    fetcher
  );

  const columnas: ColumnDef<RegistroAuditoria>[] = [
    {
      header: "Usuario",
      accessorKey: "usuarioEmail",
      enableSorting: true,
    },
    {
      header: "Acción",
      accessorKey: "accion",
      enableSorting: true,
      cell: ({ getValue }) => {
        const acc = getValue() as string;
        return (
          <Badge variante={badgeAccion[acc] ?? "info"}>
            {acc}
          </Badge>
        );
      },
    },
    {
      header: "Tabla",
      accessorKey: "tabla",
      enableSorting: true,
    },
    {
      header: "ID registro",
      accessorKey: "registroId",
      enableSorting: true,
    },
    {
      header: "Fecha",
      accessorKey: "createdAt",
      enableSorting: true,
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleString("es-CR"),
    },
  ];

  if (!usuario || usuario.nivel > 1) {
    return (
      <EstadoVacio
        mensaje="Acceso restringido"
        descripcion="Solo los administradores de nivel país pueden ver la auditoría."
        icono={<ShieldAlert className="h-8 w-8 text-gray-400" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-texto">Auditoría</h1>
        <p className="mt-1 text-sm text-gray-500">
          Historial de cambios del sistema.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {error.message}
        </div>
      )}

      {isLoading && <Cargando />}

      {!isLoading && registros && registros.length === 0 && (
        <EstadoVacio
          mensaje="Sin registros de auditoría"
          descripcion="Aún no hay cambios registrados en el sistema."
        />
      )}

      {registros && registros.length > 0 && (
        <Tabla
          columnas={columnas}
          datos={registros}
          onFilaClick={(fila) => setSeleccionado(fila)}
        />
      )}

      <Modal
        abierto={seleccionado !== null}
        onCerrar={() => setSeleccionado(null)}
        titulo="Detalle de auditoría"
        tamano="lg"
      >
        {seleccionado && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Usuario
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.usuarioEmail}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Acción
                </label>
                <Badge
                  variante={badgeAccion[seleccionado.accion] ?? "info"}
                >
                  {seleccionado.accion}
                </Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Tabla
                </label>
                <p className="text-sm text-texto">{seleccionado.tabla}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  ID de registro
                </label>
                <p className="text-sm text-texto">
                  {seleccionado.registroId}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Fecha
                </label>
                <p className="text-sm text-texto">
                  {new Date(seleccionado.createdAt).toLocaleString("es-CR")}
                </p>
              </div>
            </div>

            {seleccionado.datosAnteriores && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Datos anteriores
                </label>
                <pre className="mt-1 rounded-lg bg-superficie p-3 text-xs text-texto overflow-auto max-h-40">
                  {JSON.stringify(
                    JSON.parse(seleccionado.datosAnteriores),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}

            {seleccionado.datosNuevos && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Datos nuevos
                </label>
                <pre className="mt-1 rounded-lg bg-superficie p-3 text-xs text-texto overflow-auto max-h-40">
                  {JSON.stringify(
                    JSON.parse(seleccionado.datosNuevos),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
