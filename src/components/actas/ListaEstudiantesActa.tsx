import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { Boton } from "@/components/ui/Boton";
import { Tabla } from "@/components/ui/Tabla";
import type { EstudianteRegistrado } from "./tipos";
import { Seccion } from "./Seccion";

interface ListaEstudiantesActaProps {
  estudiantes: EstudianteRegistrado[];
  onAgregar?: () => void;
  agregarDeshabilitado?: boolean;
  mensajeVacio?: string;
}

const columnas: ColumnDef<EstudianteRegistrado>[] = [
  {
    header: "Nombre",
    id: "nombre",
    accessorFn: (fila) => `${fila.nombres} ${fila.apellidos}`,
  },
  {
    header: "Identificación",
    accessorKey: "identificacion",
    meta: { className: "tabular-nums" },
  },
  {
    header: "N° certificado",
    accessorKey: "numeroCertificado",
    meta: { className: "text-right tabular-nums" },
  },
];

export function ListaEstudiantesActa({
  estudiantes,
  onAgregar,
  agregarDeshabilitado = false,
  mensajeVacio = "Sin estudiantes asociados a esta acta.",
}: ListaEstudiantesActaProps) {
  return (
    <Seccion
      titulo={`Estudiantes registrados (${estudiantes.length})`}
      acciones={
        onAgregar && (
          <Boton
            type="button"
            variante="acento"
            tamano="sm"
            onClick={onAgregar}
            disabled={agregarDeshabilitado}
          >
            <Plus aria-hidden className="size-4" />
            Agregar estudiante
          </Boton>
        )
      }
    >
      {estudiantes.length === 0 ? (
        <p className="text-sm text-texto-suave">{mensajeVacio}</p>
      ) : (
        <Tabla
          columnas={columnas}
          datos={estudiantes}
          paginacion={false}
          className="h-[min(32rem,60dvh)] max-h-[min(32rem,60dvh)] flex-none lg:h-auto lg:max-h-none lg:min-h-0 lg:flex-1"
        />
      )}
    </Seccion>
  );
}
