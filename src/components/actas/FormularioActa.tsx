"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { Alerta } from "@/components/ui/Alerta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Tabla } from "@/components/ui/Tabla";
import type { ColumnDef } from "@tanstack/react-table";
import { FilaEstudiante } from "./FilaEstudiante";
import { Seccion } from "./Seccion";

export interface EstudianteFormulario {
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: string;
}

export interface ValoresFormularioActa {
  escuelaId: string;
  tipoActaId: string;
  titulo: string;
  numeroTomo: string;
  folioInicio: string;
  folioFin: string;
  fecha: string;
  actaReferenciaId: string;
  estudiantes: EstudianteFormulario[];
}

export interface EstudianteRegistrado {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: number;
}

interface FormularioActaProps {
  modo: "crear" | "editar";
  tiposActa: { id: number; nombre: string }[];
  escuelas: { id: number; nombre: string }[];
  puedeElegirEscuela: boolean;
  escuelaFijaId?: number;
  valoresIniciales?: Partial<ValoresFormularioActa>;
  estudiantesExistentes?: EstudianteRegistrado[];
  onGuardar: (datos: ValoresFormularioActa, escuelaId: number) => Promise<void>;
}

const TIPOS_CON_REFERENCIA = ["2", "3"];
const ESTUDIANTE_VACIO: EstudianteFormulario = {
  identificacion: "",
  nombres: "",
  apellidos: "",
  numeroCertificado: "",
};

const columnasRegistrados: ColumnDef<EstudianteRegistrado>[] = [
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

export function FormularioActa({
  modo,
  tiposActa,
  escuelas,
  puedeElegirEscuela,
  escuelaFijaId,
  valoresIniciales,
  estudiantesExistentes = [],
  onGuardar,
}: FormularioActaProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const alertaRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ValoresFormularioActa>({
    mode: "onBlur",
    defaultValues: {
      escuelaId: "",
      tipoActaId: "",
      titulo: "",
      numeroTomo: "",
      folioInicio: "",
      folioFin: "",
      fecha: modo === "crear" ? new Date().toISOString().split("T")[0] : "",
      actaReferenciaId: "",
      estudiantes: [],
      ...valoresIniciales,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "estudiantes",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const tipoActaId = watch("tipoActaId");

  useEffect(() => {
    if (error) alertaRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [error]);

  const sinEscuela = !puedeElegirEscuela && escuelaFijaId === undefined;

  const enviar = async (datos: ValoresFormularioActa) => {
    const escuelaId = puedeElegirEscuela ? Number(datos.escuelaId) : escuelaFijaId;
    if (escuelaId === undefined) return;
    setError("");
    setEnviando(true);
    try {
      await onGuardar(datos, escuelaId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el acta");
    } finally {
      setEnviando(false);
    }
  };

  const enEdicion = modo === "editar";

  return (
    <form onSubmit={handleSubmit(enviar)} className="flex flex-col gap-6">
      <Seccion titulo="Datos del acta">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Selector
            label="Tipo de acta"
            requerido
            opciones={tiposActa.map((t) => ({ valor: t.id, etiqueta: t.nombre }))}
            placeholder="Seleccione un tipo"
            error={errors.tipoActaId?.message}
            {...register("tipoActaId", { required: "El tipo es requerido" })}
          />

          <Campo
            label="Título / N° de acta"
            requerido
            placeholder="Ej: Acta 001-2025"
            error={errors.titulo?.message}
            {...register("titulo", { required: "El título es requerido" })}
          />

          {puedeElegirEscuela && (
            <Selector
              label="Escuela"
              requerido
              opciones={escuelas.map((e) => ({
                valor: String(e.id),
                etiqueta: e.nombre,
              }))}
              placeholder="Seleccione una escuela"
              error={errors.escuelaId?.message}
              {...register("escuelaId", { required: "La escuela es requerida" })}
            />
          )}

          <Campo
            label="Fecha"
            requerido
            type="date"
            error={errors.fecha?.message}
            {...register("fecha", { required: "La fecha es requerida" })}
          />

          <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-3">
            <Campo
              label="N° de tomo"
              requerido
              type="number"
              placeholder="Ej: 4"
              error={errors.numeroTomo?.message}
              {...register("numeroTomo", {
                required: "El tomo es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />

            <Campo
              label="Folio inicio"
              requerido
              type="number"
              placeholder="Ej: 1"
              error={errors.folioInicio?.message}
              {...register("folioInicio", {
                required: "El folio inicio es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />

            <Campo
              label="Folio fin"
              requerido
              type="number"
              placeholder="Ej: 5"
              ayuda="Debe ser mayor o igual al folio inicial."
              error={errors.folioFin?.message}
              {...register("folioFin", {
                required: "El folio fin es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
                validate: (valor, valores) =>
                  Number(valor) >= Number(valores.folioInicio) ||
                  "El folio final debe ser mayor o igual al inicial",
              })}
            />
          </div>

          {TIPOS_CON_REFERENCIA.includes(tipoActaId) && (
            <Campo
              label="Acta de referencia (ID)"
              type="number"
              placeholder="ID del acta original"
              ayuda="Indique el ID del acta que se está trasladando o rectificando."
              {...register("actaReferenciaId")}
            />
          )}
        </div>
      </Seccion>

      {enEdicion && (
        <Seccion titulo={`Estudiantes registrados (${estudiantesExistentes.length})`}>
          {estudiantesExistentes.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Sin estudiantes asociados a esta acta.
            </p>
          ) : (
            <Tabla
              columnas={columnasRegistrados}
              datos={estudiantesExistentes}
              paginacion={false}
              className="h-[min(24rem,50dvh)] max-h-[min(24rem,50dvh)] flex-none"
            />
          )}
        </Seccion>
      )}

      <Seccion
        titulo={enEdicion ? "Agregar estudiantes" : "Estudiantes"}
        descripcion={
          enEdicion
            ? "Use el botón para agregar estudiantes nuevos al acta."
            : "Registre los estudiantes asociados a esta acta."
        }
        acciones={
          <Boton
            type="button"
            variante="secundario"
            tamano="sm"
            onClick={() => append(ESTUDIANTE_VACIO, { shouldFocus: true })}
          >
            <Plus aria-hidden className="size-4" />
            Agregar estudiante
          </Boton>
        }
      >
        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-texto-suave">
            No hay estudiantes agregados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((campo, indice) => (
              <FilaEstudiante
                key={campo.id}
                indice={indice}
                register={register}
                errores={errors}
                onQuitar={() => remove(indice)}
              />
            ))}
          </div>
        )}
      </Seccion>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-borde bg-white/85 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        {error && (
          <div ref={alertaRef}>
            <Alerta variante="error">{error}</Alerta>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Boton asChild variante="secundario">
            <Link href="/actas">Cancelar</Link>
          </Boton>
          <Boton type="submit" cargando={enviando} disabled={sinEscuela}>
            {enEdicion ? "Guardar cambios" : "Guardar acta"}
          </Boton>
        </div>
      </div>
    </form>
  );
}
