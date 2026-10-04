"use client";

import { useState } from "react";
import useSWR from "swr";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ShieldAlert } from "lucide-react";
import {
  Alerta,
  Badge,
  Boton,
  EncabezadoPagina,
  EstadoVacio,
  Esqueleto,
  ListaDefiniciones,
  Modal,
  Selector,
  Tabla,
} from "@/components/ui";
import { obtenerJsonEstricto } from "@/lib/api-cliente";
import {
  analizarJsonSeguro,
  compararDatos,
  esObjetoPlano,
  etiquetaAccion,
  etiquetaTabla,
  varianteAccion,
} from "@/lib/auditoria";
import { formatearFechaCompleta, formatearFechaCorta } from "@/lib/formato-fecha";
import { cn } from "@/lib/utils";
import { useSesion } from "@/hooks/useSesion";
import { useValorRetenido } from "@/hooks/useValorRetenido";

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

const insigniaAccion = (accion: string) => (
  <Badge variante={varianteAccion(accion)}>{etiquetaAccion(accion)}</Badge>
);

const fechaCorta = (valor: string) => (
  <time
    dateTime={valor}
    title={formatearFechaCompleta(valor)}
    className="tabular-nums"
  >
    {formatearFechaCorta(valor)}
  </time>
);

const columnas: ColumnDef<RegistroAuditoria>[] = [
  { header: "Usuario", accessorKey: "usuarioEmail", enableSorting: true },
  {
    header: "Acción",
    accessorKey: "accion",
    enableSorting: true,
    cell: ({ getValue }) => insigniaAccion(getValue() as string),
  },
  {
    header: "Tabla",
    accessorKey: "tabla",
    enableSorting: true,
    cell: ({ getValue }) => etiquetaTabla(getValue() as string),
  },
  {
    header: "ID registro",
    accessorKey: "registroId",
    enableSorting: true,
    meta: { className: "tabular-nums" },
  },
  {
    header: "Fecha",
    accessorKey: "createdAt",
    enableSorting: true,
    cell: ({ getValue }) => fechaCorta(getValue() as string),
  },
  {
    id: "detalle",
    header: "",
    enableSorting: false,
    meta: { className: "w-10" },
    cell: () => <ChevronRight aria-hidden className="size-4 text-texto-suave" />,
  },
];

function DatosCrudos({ titulo, valor }: { titulo: string; valor: unknown }) {
  const texto = typeof valor === "string" ? valor : JSON.stringify(valor, null, 2);
  return (
    <div>
      <p className="text-xs font-medium text-texto-suave">{titulo}</p>
      <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-superficie p-3 text-xs text-texto">
        {texto}
      </pre>
    </div>
  );
}

function DetalleDatos({ registro }: { registro: RegistroAuditoria }) {
  const anteriores = analizarJsonSeguro(registro.datosAnteriores);
  const nuevos = analizarJsonSeguro(registro.datosNuevos);

  if (anteriores === null && nuevos === null) return null;

  const comparables =
    (anteriores === null || esObjetoPlano(anteriores)) &&
    (nuevos === null || esObjetoPlano(nuevos));

  if (!comparables) {
    return (
      <div className="flex flex-col gap-4">
        {anteriores !== null && <DatosCrudos titulo="Datos anteriores" valor={anteriores} />}
        {nuevos !== null && <DatosCrudos titulo="Datos nuevos" valor={nuevos} />}
      </div>
    );
  }

  const filas = compararDatos(
    anteriores as Record<string, unknown> | null,
    nuevos as Record<string, unknown> | null
  );

  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-borde">
      <table aria-label="Comparación de datos" className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-superficie text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Campo</th>
            <th scope="col" className="px-3 py-2 font-medium">Antes</th>
            <th scope="col" className="px-3 py-2 font-medium">Después</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.campo}
              className={cn(
                "border-t border-borde",
                fila.estado === "cambiado" && "bg-acento/10"
              )}
            >
              <th scope="row" className="px-3 py-2 font-medium text-texto">
                {fila.campo}
              </th>
              <td
                className={cn(
                  "break-all px-3 py-2 text-texto",
                  fila.estado === "removido" && "text-error line-through"
                )}
              >
                {fila.antes ?? "—"}
              </td>
              <td
                className={cn(
                  "break-all px-3 py-2 text-texto",
                  fila.estado === "agregado" && "text-exito"
                )}
              >
                {fila.despues ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Auditoria() {
  const { usuario, cargando: cargandoSesion } = useSesion();
  const [seleccionado, setSeleccionado] = useState<RegistroAuditoria | null>(null);
  const [filtroAccion, setFiltroAccion] = useState("");
  const [filtroTabla, setFiltroTabla] = useState("");
  const registroDetalle = useValorRetenido(seleccionado);

  const autorizado = usuario !== null;

  const { data: registros, isLoading, error, mutate } = useSWR<RegistroAuditoria[]>(
    autorizado ? "/api/auditoria" : null,
    obtenerJsonEstricto
  );

  if (cargandoSesion) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Cargando">
        <Esqueleto className="h-8 w-48" />
        <Esqueleto className="h-64 w-full" />
      </div>
    );
  }

  if (!autorizado) {
    return (
      <EstadoVacio
        mensaje="Acceso restringido"
        descripcion="Inicie sesión para ver la auditoría."
        icono={<ShieldAlert className="size-6" />}
      />
    );
  }

  const lista = registros ?? [];
  const opcionesAccion = [...new Set(lista.map((r) => r.accion))].map((accion) => ({
    valor: accion,
    etiqueta: etiquetaAccion(accion),
  }));
  const opcionesTabla = [...new Set(lista.map((r) => r.tabla))].map((tabla) => ({
    valor: tabla,
    etiqueta: etiquetaTabla(tabla),
  }));
  const filtrados = lista.filter(
    (r) =>
      (!filtroAccion || r.accion === filtroAccion) &&
      (!filtroTabla || r.tabla === filtroTabla)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Muestra los cambios registrados dentro de su ámbito."
      />

      {error && (
        <Alerta variante="error">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>No se pudo cargar la auditoría.</span>
            <Boton variante="secundario" tamano="sm" onClick={() => mutate()}>
              Reintentar
            </Boton>
          </div>
        </Alerta>
      )}

      {lista.length > 0 && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
          <Selector
            label="Acción"
            opciones={[{ valor: "", etiqueta: "Todas" }, ...opcionesAccion]}
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="w-full sm:w-56"
          />
          <Selector
            label="Tabla"
            opciones={[{ valor: "", etiqueta: "Todas" }, ...opcionesTabla]}
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="w-full sm:w-56"
          />
        </div>
      )}

      {!error && (
        <Tabla
          columnas={columnas}
          datos={filtrados}
          cargando={isLoading}
          onFilaClick={setSeleccionado}
          vacio={
            <EstadoVacio
              mensaje={
                lista.length === 0
                  ? "Sin registros de auditoría"
                  : "Sin resultados para los filtros"
              }
              descripcion={
                lista.length === 0
                  ? "Aún no hay cambios registrados en el sistema."
                  : "Pruebe con otra acción o tabla."
              }
            />
          }
        />
      )}

      <Modal
        abierto={seleccionado !== null}
        onCerrar={() => setSeleccionado(null)}
        titulo="Detalle de auditoría"
        tamano="xl"
      >
        {registroDetalle && (
          <div className="flex flex-col gap-6">
            <ListaDefiniciones
              elementos={[
                { etiqueta: "Usuario", valor: registroDetalle.usuarioEmail },
                { etiqueta: "Acción", valor: insigniaAccion(registroDetalle.accion) },
                { etiqueta: "Tabla", valor: etiquetaTabla(registroDetalle.tabla) },
                {
                  etiqueta: "ID de registro",
                  valor: <span className="tabular-nums">{registroDetalle.registroId}</span>,
                },
                { etiqueta: "Fecha", valor: fechaCorta(registroDetalle.createdAt) },
              ]}
            />
            <DetalleDatos registro={registroDetalle} />
          </div>
        )}
      </Modal>
    </div>
  );
}
