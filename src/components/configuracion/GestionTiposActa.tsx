"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { Boton, Campo, Cargando, ModalFormulario, Tabla } from "@/components/ui";
import { enviarJson, obtenerJson } from "@/lib/api-cliente";
import type { TipoActa } from "./tipos";

interface DatosTipoActa {
  nombre: string;
}

export function GestionTiposActa() {
  const { data: tipos, isLoading, mutate: refrescarTipos } = useSWR<TipoActa[]>(
    "/api/tipos-acta",
    obtenerJson
  );
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
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
  };

  const eliminarTipo = async (tipo: TipoActa) => {
    const confirmado = window.confirm(
      `¿Eliminar el tipo de acta "${tipo.nombre}"?`
    );
    if (!confirmado) return;

    setEliminandoId(tipo.id);
    setError("");
    try {
      const res = await fetch(`/api/tipos-acta/${tipo.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({
          error: "Error al eliminar el tipo de acta",
        }));
        throw new Error(err.error ?? "Error al eliminar el tipo de acta");
      }
      refrescarTipos();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al eliminar el tipo de acta"
      );
    } finally {
      setEliminandoId(null);
    }
  };

  const columnas: ColumnDef<TipoActa>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "nombre", enableSorting: true },
    {
      header: "",
      id: "acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => eliminarTipo(row.original)}
          disabled={eliminandoId === row.original.id}
          title="Eliminar tipo de acta"
          aria-label="Eliminar tipo de acta"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Boton tamano="sm" onClick={() => setModalAbierto(true)}>
          <Plus className="h-4 w-4" />
          Nuevo tipo de acta
        </Boton>
      </div>
      {error && (
        <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}
      {isLoading && <Cargando />}
      {tipos && <Tabla columnas={columnas} datos={tipos} />}

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo="Nuevo tipo de acta"
        textoEnviar="Crear tipo de acta"
        onEnviar={() => handleSubmit(crearTipo)()}
      >
        <Campo
          label="Nombre"
          error={formState.errors.nombre?.message}
          {...register("nombre", {
            validate: (valor) => valor.trim() !== "" || "El nombre es requerido",
          })}
        />
      </ModalFormulario>
    </div>
  );
}
