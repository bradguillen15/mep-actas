"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import {
  Alerta,
  Boton,
  BotonIcono,
  Campo,
  DialogoConfirmacion,
  ModalFormulario,
  Tabla,
  toast,
} from "@/components/ui";
import { useValorRetenido } from "@/hooks/useValorRetenido";
import { enviarJson, obtenerJsonEstricto } from "@/lib/api-cliente";
import { ErrorCarga } from "./ErrorCarga";
import { BarraSeccion, textoConteo } from "./BarraSeccion";
import type { TipoActa } from "./tipos";

interface DatosTipoActa {
  nombre: string;
}

const MENSAJE_ERROR_ELIMINAR = "Error al eliminar el tipo de acta";

export function GestionTiposActa() {
  const {
    data: tipos,
    isLoading,
    error: errorCarga,
    mutate: refrescarTipos,
  } = useSWR<TipoActa[]>("/api/tipos-acta", obtenerJsonEstricto);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState<TipoActa | null>(null);
  const tipoAEliminarMostrado = useValorRetenido(tipoAEliminar);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState } = useForm<DatosTipoActa>({
    defaultValues: { nombre: "" },
  });

  const cerrarModal = () => {
    setModalAbierto(false);
    reset();
  };

  const crearTipo = async ({ nombre }: DatosTipoActa) => {
    await enviarJson(
      "/api/tipos-acta",
      { nombre: nombre.trim() },
      "No se pudo crear el tipo de acta"
    );
    await refrescarTipos();
    cerrarModal();
    toast.success("Tipo de acta creado");
  };

  const eliminarTipo = async () => {
    if (!tipoAEliminar) return;
    setError("");
    try {
      const res = await fetch(`/api/tipos-acta/${tipoAEliminar.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const detalle = await res.json().catch(() => ({}));
        throw new Error(detalle.error ?? MENSAJE_ERROR_ELIMINAR);
      }
      await refrescarTipos();
      toast.success("Tipo de acta eliminado");
    } catch (e) {
      setError(e instanceof Error ? e.message : MENSAJE_ERROR_ELIMINAR);
    } finally {
      setTipoAEliminar(null);
    }
  };

  const columnas: ColumnDef<TipoActa>[] = [
    {
      header: "ID",
      accessorKey: "id",
      meta: { className: "w-16 text-texto-suave tabular-nums" },
    },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    {
      header: "",
      id: "acciones",
      enableSorting: false,
      meta: { className: "w-14 text-right" },
      cell: ({ row }) => (
        <BotonIcono
          variante="peligro"
          etiqueta={`Eliminar tipo de acta ${row.original.nombre}`}
          icono={<Trash2 aria-hidden />}
          onClick={() => setTipoAEliminar(row.original)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <BarraSeccion
        texto={tipos && textoConteo(tipos.length, "tipo de acta", "tipos de acta")}
        accion={
          <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
            <Plus className="h-4 w-4" />
            Nuevo tipo de acta
          </Boton>
        }
      />
      {error && <Alerta variante="error">{error}</Alerta>}
      {errorCarga ? (
        <ErrorCarga
          mensaje="No se pudieron cargar los tipos de acta"
          onReintentar={() => void refrescarTipos()}
        />
      ) : (
        <Tabla columnas={columnas} datos={tipos ?? []} cargando={isLoading} />
      )}

      <DialogoConfirmacion
        abierto={tipoAEliminar !== null}
        onCerrar={() => setTipoAEliminar(null)}
        onConfirmar={eliminarTipo}
        titulo="Eliminar tipo de acta"
        descripcion={`Se eliminará el tipo de acta "${tipoAEliminarMostrado?.nombre ?? ""}". Esta acción no se puede deshacer.`}
        etiquetaConfirmar="Eliminar"
        variante="peligro"
      />

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nuevo tipo de acta"
        textoEnviar="Crear tipo de acta"
        onEnviar={() => handleSubmit(crearTipo)()}
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
