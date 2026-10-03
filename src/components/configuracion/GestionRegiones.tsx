"use client";

import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Badge, Boton, Campo, ModalFormulario, Tabla, toast } from "@/components/ui";
import { useSesion } from "@/hooks/useSesion";
import { enviarJson, obtenerJsonEstricto } from "@/lib/api-cliente";
import { ErrorCarga } from "./ErrorCarga";
import { BarraSeccion, textoConteo } from "./BarraSeccion";
import type { Region } from "./tipos";

interface DatosRegion {
  nombre: string;
}

const columnas: ColumnDef<Region>[] = [
  {
    header: "ID",
    accessorKey: "id",
    meta: { className: "w-16 text-texto-suave tabular-nums" },
  },
  { header: "Nombre", accessorKey: "nombre", enableSorting: true },
  {
    header: "Estado",
    accessorKey: "activo",
    cell: ({ getValue }) =>
      getValue() ? <Badge variante="exito">Activa</Badge> : <Badge variante="error">Inactiva</Badge>,
  },
];

export function GestionRegiones() {
  const { usuario } = useSesion();
  const {
    data: regiones,
    isLoading,
    error,
    mutate: refrescarRegiones,
  } = useSWR<Region[]>("/api/regiones", obtenerJsonEstricto);
  const [modalAbierto, setModalAbierto] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<DatosRegion>({
    defaultValues: { nombre: "" },
  });

  const puedeCrear = usuario?.nivel === 1;

  const cerrarModal = () => {
    setModalAbierto(false);
    reset();
  };

  const crearRegion = async ({ nombre }: DatosRegion) => {
    await enviarJson("/api/regiones", { nombre: nombre.trim() }, "No se pudo crear la región");
    await mutate("/api/regiones");
    cerrarModal();
    toast.success("Región creada");
  };

  return (
    <div className="flex flex-col gap-4">
      <BarraSeccion
        texto={regiones && textoConteo(regiones.length, "región", "regiones")}
        accion={
          puedeCrear && (
            <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
              <Plus className="h-4 w-4" />
              Nueva región
            </Boton>
          )
        }
      />
      {error ? (
        <ErrorCarga
          mensaje="No se pudieron cargar las regiones"
          onReintentar={() => void refrescarRegiones()}
        />
      ) : (
        <Tabla columnas={columnas} datos={regiones ?? []} cargando={isLoading} />
      )}

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nueva región"
        textoEnviar="Crear región"
        onEnviar={() => handleSubmit(crearRegion)()}
      >
        <Campo
          label="Nombre"
          requerido
          autoFocus
          error={formState.errors.nombre?.message}
          {...register("nombre", {
            validate: (valor) => valor.trim() !== "" || "El nombre es requerido",
          })}
        />
      </ModalFormulario>
    </div>
  );
}
