"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import useSWR from "swr";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Cargando } from "@/components/ui/Cargando";
import { useEscuelaActual } from "../../../../src/hooks/useEscuelaActual";
import { resolverPersonaPorIdentificacion } from "@/lib/personas";

interface TipoActa {
  id: number;
  nombre: string;
}

interface ActaEstudiante {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: number;
}

interface ActaDetalle {
  acta: {
    id: number;
    escuelaId: number;
    tipoActaId: number;
    titulo: string;
    numeroTomo: number;
    folioInicio: number;
    folioFin: number;
    fecha: string;
    actaReferenciaId: number | null;
  };
  estudiantes: ActaEstudiante[];
}

interface FormularioActa {
  tipoActaId: string;
  titulo: string;
  numeroTomo: string;
  folioInicio: string;
  folioFin: string;
  fecha: string;
  actaReferenciaId: string;
  estudiantes: {
    identificacion: string;
    nombres: string;
    apellidos: string;
    numeroCertificado: string;
  }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditarActa() {
  const router = useRouter();
  const params = useParams();
  const actaId = Number(params.id);
  const { escuelaId, puedeElegirEscuela, escuelas } = useEscuelaActual();

  const { data: tiposActa } = useSWR<TipoActa[]>("/api/tipos-acta", fetcher);
  const { data: detalle, isLoading } = useSWR<ActaDetalle>(
    actaId ? `/api/actas/${actaId}` : null,
    fetcher
  );

  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormularioActa>({
    defaultValues: {
      tipoActaId: "",
      titulo: "",
      numeroTomo: "",
      folioInicio: "",
      folioFin: "",
      fecha: "",
      actaReferenciaId: "",
      estudiantes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "estudiantes",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const tipoActaId = watch("tipoActaId");

  useEffect(() => {
    if (!detalle) return;

    reset({
      tipoActaId: String(detalle.acta.tipoActaId),
      titulo: detalle.acta.titulo,
      numeroTomo: String(detalle.acta.numeroTomo),
      folioInicio: String(detalle.acta.folioInicio),
      folioFin: String(detalle.acta.folioFin),
      fecha: detalle.acta.fecha.split("T")[0],
      actaReferenciaId: detalle.acta.actaReferenciaId
        ? String(detalle.acta.actaReferenciaId)
        : "",
      estudiantes: [],
    });
    setEscuelaSeleccionada(String(detalle.acta.escuelaId));
  }, [detalle, reset]);

  const onSubmit = async (datos: FormularioActa) => {
    setError("");
    setEnviando(true);

    try {
      const actaBody = {
        escuelaId: Number(escuelaSeleccionada || escuelaId),
        tipoActaId: Number(datos.tipoActaId),
        titulo: datos.titulo,
        numeroTomo: Number(datos.numeroTomo),
        folioInicio: Number(datos.folioInicio),
        folioFin: Number(datos.folioFin),
        fecha: new Date(datos.fecha).toISOString(),
        ...(datos.actaReferenciaId
          ? { actaReferenciaId: Number(datos.actaReferenciaId) }
          : { actaReferenciaId: null }),
      };

      const resActa = await fetch(`/api/actas/${actaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actaBody),
      });

      if (!resActa.ok) {
        const err = await resActa
          .json()
          .catch(() => ({ error: "Error al actualizar acta" }));
        throw new Error(err.error ?? "Error al actualizar acta");
      }

      for (const est of datos.estudiantes) {
        const personaId = await resolverPersonaPorIdentificacion(est);

        const resEst = await fetch(`/api/actas/${actaId}/estudiantes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personaId,
            numeroCertificado: Number(est.numeroCertificado),
          }),
        });

        if (!resEst.ok) throw new Error("Error al agregar estudiante");
      }

      router.push("/actas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el acta");
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading || !detalle) {
    return <Cargando />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-texto">Editar acta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Modifique los datos del acta o agregue estudiantes adicionales.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Tarjeta>
          <h2 className="mb-4 text-base font-semibold text-texto">
            A. Datos del acta
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Selector
              label="Tipo de acta"
              opciones={(tiposActa ?? []).map((t) => ({
                valor: t.id,
                etiqueta: t.nombre,
              }))}
              placeholder="Seleccione un tipo"
              error={errors.tipoActaId?.message}
              {...register("tipoActaId", { required: "El tipo es requerido" })}
            />

            <Campo
              label="Título / N° de acta"
              placeholder="Ej: Acta 001-2025"
              error={errors.titulo?.message}
              {...register("titulo", { required: "El título es requerido" })}
            />

            {puedeElegirEscuela ? (
              <Selector
                label="Escuela"
                opciones={escuelas.map((e) => ({
                  valor: String(e.id),
                  etiqueta: e.nombre,
                }))}
                placeholder="Seleccione una escuela"
                value={escuelaSeleccionada}
                onChange={(e) => setEscuelaSeleccionada(e.target.value)}
              />
            ) : (
              <Campo
                label="Escuela"
                value={
                  escuelas.find((e) => e.id === detalle.acta.escuelaId)?.nombre ??
                  ""
                }
                disabled
              />
            )}

            <Campo
              label="N° de tomo"
              type="number"
              error={errors.numeroTomo?.message}
              {...register("numeroTomo", {
                required: "El tomo es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />

            <Campo
              label="Folio inicio"
              type="number"
              error={errors.folioInicio?.message}
              {...register("folioInicio", {
                required: "El folio inicio es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />

            <Campo
              label="Folio fin"
              type="number"
              error={errors.folioFin?.message}
              {...register("folioFin", {
                required: "El folio fin es requerido",
                min: { value: 1, message: "Debe ser mayor a 0" },
              })}
            />

            <Campo
              label="Fecha"
              type="date"
              error={errors.fecha?.message}
              {...register("fecha", { required: "La fecha es requerida" })}
            />

            {tipoActaId === "2" || tipoActaId === "3" ? (
              <Campo
                label="Acta de referencia (ID)"
                type="number"
                placeholder="ID del acta original"
                {...register("actaReferenciaId")}
              />
            ) : null}
          </div>
        </Tarjeta>

        <Tarjeta>
          <h2 className="mb-4 text-base font-semibold text-texto">
            B. Estudiantes registrados ({detalle.estudiantes.length})
          </h2>
          {detalle.estudiantes.length === 0 ? (
            <p className="text-sm text-gray-500">
              Sin estudiantes asociados a este acta.
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
                    <tr key={est.id} className="border-t border-borde">
                      <td className="px-3 py-2">
                        {est.nombres} {est.apellidos}
                      </td>
                      <td className="px-3 py-2">{est.identificacion}</td>
                      <td className="px-3 py-2">{est.numeroCertificado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>

        <Tarjeta>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-texto">
              C. Agregar estudiantes
            </h2>
            <Boton
              type="button"
              variante="secundario"
              tamano="sm"
              onClick={() =>
                append({
                  identificacion: "",
                  nombres: "",
                  apellidos: "",
                  numeroCertificado: "",
                })
              }
            >
              <Plus className="h-4 w-4" />
              Agregar estudiante
            </Boton>
          </div>

          {fields.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              Use el botón para agregar estudiantes nuevos al acta.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-lg border border-borde p-3"
              >
                <div className="grid flex-1 grid-cols-4 gap-3">
                  <Campo
                    placeholder="Cédula"
                    error={
                      (
                        errors.estudiantes as Record<
                          string,
                          { identificacion?: { message?: string } }
                        >
                      )?.[String(index)]?.identificacion?.message
                    }
                    {...register(`estudiantes.${index}.identificacion`, {
                      required: "Requerido",
                    })}
                  />
                  <Campo
                    placeholder="Nombres"
                    error={
                      (
                        errors.estudiantes as Record<
                          string,
                          { nombres?: { message?: string } }
                        >
                      )?.[String(index)]?.nombres?.message
                    }
                    {...register(`estudiantes.${index}.nombres`, {
                      required: "Requerido",
                    })}
                  />
                  <Campo
                    placeholder="Apellidos"
                    error={
                      (
                        errors.estudiantes as Record<
                          string,
                          { apellidos?: { message?: string } }
                        >
                      )?.[String(index)]?.apellidos?.message
                    }
                    {...register(`estudiantes.${index}.apellidos`, {
                      required: "Requerido",
                    })}
                  />
                  <Campo
                    placeholder="N° certificado"
                    type="number"
                    error={
                      (
                        errors.estudiantes as Record<
                          string,
                          { numeroCertificado?: { message?: string } }
                        >
                      )?.[String(index)]?.numeroCertificado?.message
                    }
                    {...register(`estudiantes.${index}.numeroCertificado`, {
                      required: "Requerido",
                    })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Tarjeta>

        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Boton type="submit" cargando={enviando} disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar cambios"}
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            onClick={() => router.push("/actas")}
          >
            Cancelar
          </Boton>
        </div>
      </form>
    </div>
  );
}
