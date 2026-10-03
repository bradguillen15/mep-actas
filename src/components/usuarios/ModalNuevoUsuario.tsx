"use client";

import { useForm } from "react-hook-form";
import { Campo, ModalFormulario, Selector } from "@/components/ui";
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

const requerido = (mensaje: string) => (valor: string) =>
  valor.trim() !== "" || mensaje;

export function ModalNuevoUsuario({
  abierto,
  onCerrar,
  onCreado,
  roles,
  funcionarios,
}: ModalNuevoUsuarioProps) {
  const { register, handleSubmit, reset, formState } = useForm<DatosNuevoUsuario>({
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
  };

  return (
    <ModalFormulario
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Invitar usuario"
      textoEnviar="Crear"
      onEnviar={() => handleSubmit(crearUsuario)()}
    >
      <Selector
        label="Funcionario"
        placeholder="Seleccione un funcionario"
        opciones={funcionarios.map((f) => ({
          valor: f.id,
          etiqueta: `${f.nombres} ${f.apellidos}`,
        }))}
        error={formState.errors.funcionarioId?.message}
        {...register("funcionarioId", {
          validate: requerido("El funcionario es requerido"),
        })}
      />
      <Selector
        label="Rol"
        placeholder="Seleccione un rol"
        opciones={roles.map((r) => ({ valor: r.id, etiqueta: r.nombre }))}
        error={formState.errors.rolId?.message}
        {...register("rolId", { validate: requerido("El rol es requerido") })}
      />
      <Campo
        label="Correo electrónico"
        type="email"
        placeholder="correo@mep.go.cr"
        error={formState.errors.email?.message}
        {...register("email", {
          validate: requerido("El correo electrónico es requerido"),
        })}
      />
      <Campo
        label="Contraseña temporal"
        type="password"
        error={formState.errors.password?.message}
        {...register("password", {
          validate: requerido("La contraseña es requerida"),
        })}
      />
    </ModalFormulario>
  );
}
