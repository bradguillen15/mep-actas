"use client";

import { useForm } from "react-hook-form";

import { Campo } from "@/components/ui/Campo";
import { ModalFormulario } from "@/components/ui/ModalFormulario";
import type { EstudianteFormulario } from "./tipos";

interface ModalAgregarEstudianteProps {
  abierto: boolean;
  onCerrar: () => void;
  onAgregar: (estudiante: EstudianteFormulario) => Promise<void>;
}

const VALORES_VACIOS: EstudianteFormulario = {
  identificacion: "",
  nombres: "",
  apellidos: "",
  numeroCertificado: "",
};

const REQUERIDO = { required: "Requerido" } as const;

export function ModalAgregarEstudiante({
  abierto,
  onCerrar,
  onAgregar,
}: ModalAgregarEstudianteProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstudianteFormulario>({ defaultValues: VALORES_VACIOS });

  const cerrar = () => {
    reset(VALORES_VACIOS);
    onCerrar();
  };

  const enviar = handleSubmit(async (datos) => {
    await onAgregar(datos);
    reset(VALORES_VACIOS);
  });

  return (
    <ModalFormulario
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Agregar estudiante"
      textoEnviar="Agregar"
      onEnviar={enviar}
    >
      <Campo
        label="Cédula"
        requerido
        error={errors.identificacion?.message}
        {...register("identificacion", REQUERIDO)}
      />
      <Campo
        label="Nombres"
        requerido
        error={errors.nombres?.message}
        {...register("nombres", REQUERIDO)}
      />
      <Campo
        label="Apellidos"
        requerido
        error={errors.apellidos?.message}
        {...register("apellidos", REQUERIDO)}
      />
      <Campo
        label="N° certificado"
        requerido
        type="number"
        error={errors.numeroCertificado?.message}
        {...register("numeroCertificado", REQUERIDO)}
      />
    </ModalFormulario>
  );
}
