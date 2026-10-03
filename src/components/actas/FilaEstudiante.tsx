import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { BotonIcono } from "@/components/ui/BotonIcono";
import { Campo } from "@/components/ui/Campo";
import type { ValoresFormularioActa } from "./FormularioActa";

interface FilaEstudianteProps {
  indice: number;
  register: UseFormRegister<ValoresFormularioActa>;
  errores: FieldErrors<ValoresFormularioActa>;
  onQuitar: () => void;
}

const REQUERIDO = { required: "Requerido" } as const;

export function FilaEstudiante({
  indice,
  register,
  errores,
  onQuitar,
}: FilaEstudianteProps) {
  const numero = indice + 1;
  // eslint-disable-next-line security/detect-object-injection -- índice numérico del useFieldArray
  const erroresFila = errores.estudiantes?.[indice];

  return (
    <div className="animate-in rounded-lg border border-borde p-3 duration-200 fade-in-0 slide-in-from-top-1">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-texto">Estudiante {numero}</h3>
        <BotonIcono
          variante="peligro"
          tamano="sm"
          etiqueta={`Quitar estudiante ${numero}`}
          icono={<Trash2 aria-hidden />}
          onClick={onQuitar}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo
          label="Cédula"
          requerido
          aria-label={`Cédula del estudiante ${numero}`}
          error={erroresFila?.identificacion?.message}
          {...register(`estudiantes.${indice}.identificacion`, REQUERIDO)}
        />
        <Campo
          label="Nombres"
          requerido
          aria-label={`Nombres del estudiante ${numero}`}
          error={erroresFila?.nombres?.message}
          {...register(`estudiantes.${indice}.nombres`, REQUERIDO)}
        />
        <Campo
          label="Apellidos"
          requerido
          aria-label={`Apellidos del estudiante ${numero}`}
          error={erroresFila?.apellidos?.message}
          {...register(`estudiantes.${indice}.apellidos`, REQUERIDO)}
        />
        <Campo
          label="N° certificado"
          requerido
          type="number"
          aria-label={`N° de certificado del estudiante ${numero}`}
          error={erroresFila?.numeroCertificado?.message}
          {...register(`estudiantes.${indice}.numeroCertificado`, REQUERIDO)}
        />
      </div>
    </div>
  );
}
