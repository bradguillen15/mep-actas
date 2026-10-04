import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Campo } from "@/components/ui/Campo";
import { Selector } from "@/components/ui/Selector";
import type { ValoresFormularioActa } from "./tipos";

interface CamposActaProps {
  register: UseFormRegister<ValoresFormularioActa>;
  control: Control<ValoresFormularioActa>;
  errors: FieldErrors<ValoresFormularioActa>;
  tiposActa: { id: number; nombre: string }[];
  escuelas: { id: number; nombre: string }[];
  puedeElegirEscuela: boolean;
  tipoActaId: string;
  alCambiarSelector?: () => void;
}

const TIPOS_CON_REFERENCIA = ["2", "3"];

export function CamposActa({
  register,
  control,
  errors,
  tiposActa,
  escuelas,
  puedeElegirEscuela,
  tipoActaId,
  alCambiarSelector,
}: CamposActaProps) {
  return (
    <div className="@container">
    <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
      <Controller
        name="tipoActaId"
        control={control}
        rules={{ required: "El tipo es requerido" }}
        render={({ field }) => (
          <Selector
            label="Tipo de acta"
            requerido
            opciones={tiposActa.map((t) => ({
              valor: t.id,
              etiqueta: t.nombre,
            }))}
            placeholder="Seleccione un tipo"
            error={errors.tipoActaId?.message}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(evento) => {
              field.onChange(evento.target.value);
              alCambiarSelector?.();
            }}
          />
        )}
      />

      <Campo
        label="Título / N° de acta"
        requerido
        placeholder="Ej: Acta 001-2025"
        error={errors.titulo?.message}
        {...register("titulo", { required: "El título es requerido" })}
      />

      {puedeElegirEscuela && (
        <Controller
          name="escuelaId"
          control={control}
          rules={{ required: "La escuela es requerida" }}
          render={({ field }) => (
            <Selector
              label="Escuela"
              requerido
              opciones={escuelas.map((e) => ({
                valor: String(e.id),
                etiqueta: e.nombre,
              }))}
              placeholder="Seleccione una escuela"
              error={errors.escuelaId?.message}
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(evento) => {
                field.onChange(evento.target.value);
                alCambiarSelector?.();
              }}
            />
          )}
        />
      )}

      <Campo
        label="Fecha"
        requerido
        type="date"
        error={errors.fecha?.message}
        {...register("fecha", { required: "La fecha es requerida" })}
      />

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
    </div>
  );
}
