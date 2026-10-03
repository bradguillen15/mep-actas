"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import {
  Badge,
  Boton,
  Campo,
  Cargando,
  ModalFormulario,
  Selector,
  Tabla,
} from "@/components/ui";
import { useSesion } from "@/hooks/useSesion";
import { enviarJson, obtenerJson } from "@/lib/api-cliente";
import type { Escuela, Region } from "./tipos";

interface DatosEscuela {
  regionId: string;
  codigoMep: string;
  nombre: string;
}

const NIVEL_ADMIN_PAIS = 1;
const NIVEL_ADMIN_REGIONAL = 2;

export function GestionEscuelas() {
  const { usuario } = useSesion();
  const { data: escuelas, isLoading } = useSWR<Escuela[]>("/api/escuelas", obtenerJson);
  const { data: regiones } = useSWR<Region[]>("/api/regiones", obtenerJson);
  const [modalAbierto, setModalAbierto] = useState(false);

  const nivel = usuario?.nivel;
  const puedeCrear = nivel === NIVEL_ADMIN_PAIS || nivel === NIVEL_ADMIN_REGIONAL;
  const regionFija = nivel === NIVEL_ADMIN_REGIONAL ? usuario?.regionId : undefined;

  const { register, handleSubmit, reset, formState } = useForm<DatosEscuela>({
    defaultValues: {
      regionId: regionFija ? String(regionFija) : "",
      codigoMep: "",
      nombre: "",
    },
  });

  const nombrePorRegion = useMemo(
    () => new Map((regiones ?? []).map((region) => [region.id, region.nombre])),
    [regiones]
  );

  const opcionesRegion = useMemo(
    () =>
      (regiones ?? [])
        .filter((region) => region.activo)
        .map((region) => ({ valor: region.id, etiqueta: region.nombre })),
    [regiones]
  );

  const columnas: ColumnDef<Escuela>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    { header: "Código MEP", accessorKey: "codigoMep" },
    {
      header: "Región",
      id: "region",
      accessorFn: (escuela) => nombrePorRegion.get(escuela.regionId) ?? "",
    },
    {
      header: "Estado",
      accessorKey: "activo",
      cell: ({ getValue }) =>
        getValue() ? <Badge variante="exito">Activa</Badge> : <Badge variante="error">Inactiva</Badge>,
    },
  ];

  const cerrarModal = () => {
    setModalAbierto(false);
    reset();
  };

  const crearEscuela = async (datos: DatosEscuela) => {
    await enviarJson(
      "/api/escuelas",
      {
        regionId: regionFija ?? Number(datos.regionId),
        codigoMep: datos.codigoMep.trim(),
        nombre: datos.nombre.trim(),
      },
      "No se pudo crear la escuela"
    );
    await mutate("/api/escuelas");
    cerrarModal();
  };

  const requerido = (mensaje: string) => (valor: string) =>
    valor.trim() !== "" || mensaje;

  return (
    <div className="flex flex-col gap-4">
      {puedeCrear && (
        <div className="flex justify-end">
          <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
            <Plus className="h-4 w-4" />
            Nueva escuela
          </Boton>
        </div>
      )}
      {isLoading ? <Cargando /> : <Tabla columnas={columnas} datos={escuelas ?? []} />}

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nueva escuela"
        textoEnviar="Crear escuela"
        onEnviar={() => handleSubmit(crearEscuela)()}
      >
        <Selector
          label="Región"
          placeholder="Seleccione una región"
          opciones={opcionesRegion}
          disabled={regionFija !== undefined}
          error={formState.errors.regionId?.message}
          {...register("regionId", {
            validate: requerido("La región es requerida"),
          })}
        />
        <Campo
          label="Código MEP"
          error={formState.errors.codigoMep?.message}
          {...register("codigoMep", {
            validate: requerido("El código MEP es requerido"),
          })}
        />
        <Campo
          label="Nombre"
          error={formState.errors.nombre?.message}
          {...register("nombre", {
            validate: requerido("El nombre es requerido"),
          })}
        />
      </ModalFormulario>
    </div>
  );
}
