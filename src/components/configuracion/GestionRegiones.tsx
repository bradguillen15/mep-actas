"use client";

import useSWR from "swr";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Ban } from "lucide-react";
import {
  Alerta,
  Badge,
  Boton,
  BotonIcono,
  Campo,
  DialogoConfirmacion,
  ModalFormulario,
  Tabla,
  toast,
} from "@/components/ui";
import { useSesion } from "@/hooks/useSesion";
import { useValorRetenido } from "@/hooks/useValorRetenido";
import {
  eliminarJson,
  enviarJson,
  obtenerJsonEstricto,
  patchJson,
} from "@/lib/api-cliente";
import { ErrorCarga } from "./ErrorCarga";
import { BarraSeccion, textoConteo } from "./BarraSeccion";
import type { Region } from "./tipos";

interface DatosRegion {
  nombre: string;
}

const MENSAJE_ERROR_DESACTIVAR = "No se pudo desactivar la región";

export function GestionRegiones() {
  const { usuario } = useSesion();
  const {
    data: regiones,
    isLoading,
    error,
    mutate: refrescarRegiones,
  } = useSWR<Region[]>("/api/regiones", obtenerJsonEstricto);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [regionEdicion, setRegionEdicion] = useState<Region | null>(null);
  const [regionADesactivar, setRegionADesactivar] = useState<Region | null>(null);
  const regionADesactivarMostrada = useValorRetenido(regionADesactivar);
  const [errorDesactivar, setErrorDesactivar] = useState("");
  const { register, handleSubmit, reset, formState } = useForm<DatosRegion>({
    defaultValues: { nombre: "" },
  });

  const puedeGestionar = usuario?.nivel === 1;
  const editando = regionEdicion !== null;

  const cerrarModal = () => {
    setModalAbierto(false);
    setRegionEdicion(null);
    reset({ nombre: "" });
  };

  const abrirCrear = () => {
    setRegionEdicion(null);
    reset({ nombre: "" });
    setModalAbierto(true);
  };

  const abrirEditar = (region: Region) => {
    setRegionEdicion(region);
    reset({ nombre: region.nombre });
    setModalAbierto(true);
  };

  const guardarRegion = async ({ nombre }: DatosRegion) => {
    const nombreLimpio = nombre.trim();
    if (regionEdicion) {
      await patchJson(
        `/api/regiones/${regionEdicion.id}`,
        { nombre: nombreLimpio },
        "No se pudo actualizar la región"
      );
      await refrescarRegiones();
      cerrarModal();
      toast.success("Región actualizada");
      return;
    }

    await enviarJson(
      "/api/regiones",
      { nombre: nombreLimpio },
      "No se pudo crear la región"
    );
    await refrescarRegiones();
    cerrarModal();
    toast.success("Región creada");
  };

  const desactivarRegion = async () => {
    if (!regionADesactivar) return;
    setErrorDesactivar("");
    try {
      await eliminarJson(
        `/api/regiones/${regionADesactivar.id}`,
        MENSAJE_ERROR_DESACTIVAR
      );
      await refrescarRegiones();
      toast.success("Región desactivada");
    } catch (e) {
      setErrorDesactivar(
        e instanceof Error ? e.message : MENSAJE_ERROR_DESACTIVAR
      );
    } finally {
      setRegionADesactivar(null);
    }
  };

  const columnas: ColumnDef<Region>[] = [
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    {
      header: "Estado",
      accessorKey: "activo",
      cell: ({ getValue }) =>
        getValue() ? <Badge variante="exito">Activa</Badge> : <Badge variante="error">Inactiva</Badge>,
    },
    ...(puedeGestionar
      ? [
          {
            header: "",
            id: "acciones",
            enableSorting: false,
            meta: { className: "w-24 text-right" },
            cell: ({ row }) => (
              <div className="flex items-center justify-end gap-1">
                <BotonIcono
                  etiqueta="Editar"
                  icono={<Pencil aria-hidden />}
                  onClick={() => abrirEditar(row.original)}
                />
                <BotonIcono
                  variante="peligro"
                  etiqueta="Desactivar"
                  icono={<Ban aria-hidden />}
                  onClick={() => setRegionADesactivar(row.original)}
                />
              </div>
            ),
          } satisfies ColumnDef<Region>,
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0">
        <BarraSeccion
          texto={regiones && textoConteo(regiones.length, "región", "regiones")}
          accion={
            puedeGestionar && (
              <Boton variante="acento" tamano="sm" onClick={abrirCrear}>
                <Plus className="h-4 w-4" />
                Nueva región
              </Boton>
            )
          }
        />
      </div>
      {errorDesactivar && <Alerta variante="error">{errorDesactivar}</Alerta>}
      {error ? (
        <ErrorCarga
          mensaje="No se pudieron cargar las regiones"
          onReintentar={() => void refrescarRegiones()}
        />
      ) : (
        <Tabla columnas={columnas} datos={regiones ?? []} cargando={isLoading} />
      )}

      <DialogoConfirmacion
        abierto={regionADesactivar !== null}
        onCerrar={() => setRegionADesactivar(null)}
        onConfirmar={desactivarRegion}
        titulo="Desactivar región"
        descripcion={`Se desactivará la región "${regionADesactivarMostrada?.nombre ?? ""}". No podrá usarse para nuevas escuelas mientras esté inactiva.`}
        etiquetaConfirmar="Desactivar"
        variante="peligro"
      />

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? "Editar región" : "Nueva región"}
        textoEnviar={editando ? "Guardar cambios" : "Crear región"}
        onEnviar={() => handleSubmit(guardarRegion)()}
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
