"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge, Boton, Campo, Cargando, ModalFormulario, Tabla } from "@/components/ui";
import { enviarJson, obtenerJson } from "@/lib/api-cliente";
import type { Usuario } from "./tipos";

interface DatosUsuario {
  email: string;
  password: string;
}

const columnas: ColumnDef<Usuario>[] = [
  { header: "Email", accessorKey: "email", enableSorting: true },
  { header: "Rol", accessorKey: "rol", enableSorting: true },
  {
    header: "Estado",
    accessorKey: "activo",
    enableSorting: true,
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variante="exito">Activo</Badge>
      ) : (
        <Badge variante="error">Inactivo</Badge>
      ),
  },
];

export function GestionUsuarios() {
  const { data: usuarios, isLoading } = useSWR<Usuario[]>("/api/usuarios", obtenerJson);
  const [modalAbierto, setModalAbierto] = useState(false);
  const { register, handleSubmit, reset } = useForm<DatosUsuario>({
    defaultValues: { email: "", password: "" },
  });

  const cerrarModal = () => {
    setModalAbierto(false);
    reset();
  };

  const crearUsuario = async (datos: DatosUsuario) => {
    await enviarJson("/api/usuarios", datos, "Error al crear usuario");
    await mutate("/api/usuarios");
    cerrarModal();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {usuarios?.length ?? 0} usuario{(usuarios?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Boton>
      </div>
      {isLoading && <Cargando />}
      {usuarios && <Tabla columnas={columnas} datos={usuarios} />}

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nuevo usuario"
        textoEnviar="Crear usuario"
        onEnviar={() => handleSubmit(crearUsuario)()}
      >
        <Campo label="Correo electrónico" type="email" {...register("email")} />
        <Campo label="Contraseña" type="password" {...register("password")} />
      </ModalFormulario>
    </div>
  );
}
