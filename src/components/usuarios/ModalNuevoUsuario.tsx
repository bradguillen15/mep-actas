"use client";

import { Controller, useForm } from "react-hook-form";
import { Campo, CampoContrasena, ModalFormulario, Selector, toast } from "@/components/ui";
import { enviarJson } from "@/lib/api-cliente";

export interface RolDisponible {
  id: number;
  nombre: string;
}

export interface FuncionarioDisponible {
  id: number;
  nombres: string;
  apellidos: string;
}

interface DatosNuevoUsuario {
  funcionarioId: string;
  rolId: string;
  email: string;
  password: string;
}

interface ModalNuevoUsuarioProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
  roles: RolDisponible[];
  funcionarios: FuncionarioDisponible[];
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AYUDA_CONTRASENA = "Mínimo 12 caracteres.";

const requerido = (mensaje: string) => (valor: string) =>
  valor.trim() !== "" || mensaje;

export function ModalNuevoUsuario({
  abierto,
  onCerrar,
  onCreado,
  roles,
  funcionarios,
}: ModalNuevoUsuarioProps) {
  const { register, control, handleSubmit, reset, formState } =
    useForm<DatosNuevoUsuario>({
      defaultValues: { funcionarioId: "", rolId: "", email: "", password: "" },
    });

  const cerrar = () => {
    reset();
    onCerrar();
  };

  const crearUsuario = async (datos: DatosNuevoUsuario) => {
    await enviarJson(
      "/api/usuarios",
      {
        funcionarioId: Number(datos.funcionarioId),
        rolId: Number(datos.rolId),
        email: datos.email.trim(),
        password: datos.password,
      },
      "No se pudo crear el usuario"
    );
    onCreado();
    cerrar();
    toast.success("Usuario creado");
  };

  return (
    <ModalFormulario
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Nuevo usuario"
      textoEnviar="Crear usuario"
      onEnviar={() => handleSubmit(crearUsuario)()}
    >
      <Controller
        name="funcionarioId"
        control={control}
        rules={{ validate: requerido("El funcionario es requerido") }}
        render={({ field }) => (
          <Selector
            label="Funcionario"
            requerido
            autoFocus
            placeholder="Seleccione un funcionario"
            opciones={funcionarios.map((f) => ({
              valor: f.id,
              etiqueta: `${f.nombres} ${f.apellidos}`,
            }))}
            error={formState.errors.funcionarioId?.message}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(evento) => field.onChange(evento.target.value)}
          />
        )}
      />
      <Controller
        name="rolId"
        control={control}
        rules={{ validate: requerido("El rol es requerido") }}
        render={({ field }) => (
          <Selector
            label="Rol"
            requerido
            placeholder="Seleccione un rol"
            opciones={roles.map((r) => ({ valor: r.id, etiqueta: r.nombre }))}
            error={formState.errors.rolId?.message}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(evento) => field.onChange(evento.target.value)}
          />
        )}
      />
      <Campo
        label="Correo electrónico"
        type="email"
        requerido
        placeholder="correo@mep.go.cr"
        error={formState.errors.email?.message}
        {...register("email", {
          validate: (valor) =>
            valor.trim() === ""
              ? "El correo electrónico es requerido"
              : PATRON_CORREO.test(valor.trim()) || "Ingrese un correo válido",
        })}
      />
      <CampoContrasena
        label="Contraseña temporal"
        requerido
        ayuda={AYUDA_CONTRASENA}
        error={formState.errors.password?.message}
        {...register("password", {
          validate: requerido("La contraseña es requerida"),
        })}
      />
    </ModalFormulario>
  );
}
