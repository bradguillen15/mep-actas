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
  ModalFormulario,
  Selector,
  Tabla,
  toast,
} from "@/components/ui";
import { useSesion } from "@/hooks/useSesion";
import { enviarJson, obtenerJsonEstricto } from "@/lib/api-cliente";
import { ErrorCarga } from "./ErrorCarga";
import { BarraSeccion, textoConteo } from "./BarraSeccion";
import type { Escuela, Region } from "./tipos";

interface DatosEscuela {
  regionId: string;
  codigoMep: string;
  nombre: string;
}

type EscuelaConRegion = Escuela & { nombreRegion: string };

const NIVEL_ADMIN_PAIS = 1;
const NIVEL_ADMIN_REGIONAL = 2;

export function GestionEscuelas() {
  const { usuario } = useSesion();
  const {
    data: escuelas,
    isLoading,
    error,
    mutate: refrescarEscuelas,
  } = useSWR<Escuela[]>("/api/escuelas", obtenerJsonEstricto);
  const { data: regiones } = useSWR<Region[]>("/api/regiones", obtenerJsonEstricto);
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

  const filas = useMemo<EscuelaConRegion[]>(
    () =>
      (escuelas ?? []).map((escuela) => ({
        ...escuela,
        nombreRegion: nombrePorRegion.get(escuela.regionId) ?? "",
      })),
    [escuelas, nombrePorRegion]
  );

  const columnas: ColumnDef<EscuelaConRegion>[] = [
    {
      header: "ID",
      accessorKey: "id",
      meta: { className: "w-16 text-texto-suave tabular-nums" },
    },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    { header: "Código MEP", accessorKey: "codigoMep" },
    {
      header: "Región",
      accessorKey: "nombreRegion",
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
    toast.success("Escuela creada");
  };

  const requerido = (mensaje: string) => (valor: string) =>
    valor.trim() !== "" || mensaje;

  return (
    <div className="flex flex-col gap-4">
      <BarraSeccion
        texto={escuelas && textoConteo(escuelas.length, "escuela", "escuelas")}
        accion={
          puedeCrear && (
            <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
              <Plus className="h-4 w-4" />
              Nueva escuela
            </Boton>
          )
        }
      />
      {error ? (
        <ErrorCarga
          mensaje="No se pudieron cargar las escuelas"
          onReintentar={() => void refrescarEscuelas()}
        />
      ) : (
        <Tabla columnas={columnas} datos={filas} cargando={isLoading} />
      )}

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nueva escuela"
        textoEnviar="Crear escuela"
        onEnviar={() => handleSubmit(crearEscuela)()}
      >
        <Selector
          label="Región"
          requerido
          autoFocus={regionFija === undefined}
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
          requerido
          autoFocus={regionFija !== undefined}
          error={formState.errors.codigoMep?.message}
          {...register("codigoMep", {
            validate: requerido("El código MEP es requerido"),
          })}
        />
        <Campo
          label="Nombre"
          requerido
          error={formState.errors.nombre?.message}
          {...register("nombre", {
            validate: requerido("El nombre es requerido"),
          })}
        />
      </ModalFormulario>
    </div>
  );
}
