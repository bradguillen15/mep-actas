"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Controller, useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Pencil, Plus } from "lucide-react";
import {
  Alerta,
  Badge,
  Boton,
  BotonIcono,
  Campo,
  DialogoConfirmacion,
  ModalFormulario,
  Selector,
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
import type { Escuela, Region } from "./tipos";

interface DatosEscuela {
  regionId: string;
  codigoMep: string;
  nombre: string;
}

type EscuelaConRegion = Escuela & { nombreRegion: string };

const NIVEL_ADMIN_PAIS = 1;
const NIVEL_ADMIN_REGIONAL = 2;
const MENSAJE_ERROR_DESACTIVAR = "No se pudo desactivar la escuela";

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
  const [escuelaEdicion, setEscuelaEdicion] = useState<Escuela | null>(null);
  const [escuelaADesactivar, setEscuelaADesactivar] = useState<Escuela | null>(null);
  const escuelaADesactivarMostrada = useValorRetenido(escuelaADesactivar);
  const [errorDesactivar, setErrorDesactivar] = useState("");

  const nivel = usuario?.nivel;
  const puedeGestionar =
    nivel === NIVEL_ADMIN_PAIS || nivel === NIVEL_ADMIN_REGIONAL;
  const regionFija = nivel === NIVEL_ADMIN_REGIONAL ? usuario?.regionId : undefined;
  const editando = escuelaEdicion !== null;

  const { register, control, handleSubmit, reset, formState } = useForm<DatosEscuela>({
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

  const cerrarModal = () => {
    setModalAbierto(false);
    setEscuelaEdicion(null);
    reset({
      regionId: regionFija ? String(regionFija) : "",
      codigoMep: "",
      nombre: "",
    });
  };

  const abrirCrear = () => {
    setEscuelaEdicion(null);
    reset({
      regionId: regionFija ? String(regionFija) : "",
      codigoMep: "",
      nombre: "",
    });
    setModalAbierto(true);
  };

  const abrirEditar = (escuela: Escuela) => {
    setEscuelaEdicion(escuela);
    reset({
      regionId: String(escuela.regionId),
      codigoMep: escuela.codigoMep,
      nombre: escuela.nombre,
    });
    setModalAbierto(true);
  };

  const guardarEscuela = async (datos: DatosEscuela) => {
    const codigoMep = datos.codigoMep.trim();
    const nombre = datos.nombre.trim();

    if (escuelaEdicion) {
      await patchJson(
        `/api/escuelas/${escuelaEdicion.id}`,
        { codigoMep, nombre },
        "No se pudo actualizar la escuela"
      );
      await refrescarEscuelas();
      cerrarModal();
      toast.success("Escuela actualizada");
      return;
    }

    await enviarJson(
      "/api/escuelas",
      {
        regionId: regionFija ?? Number(datos.regionId),
        codigoMep,
        nombre,
      },
      "No se pudo crear la escuela"
    );
    await refrescarEscuelas();
    cerrarModal();
    toast.success("Escuela creada");
  };

  const desactivarEscuela = async () => {
    if (!escuelaADesactivar) return;
    setErrorDesactivar("");
    try {
      await eliminarJson(
        `/api/escuelas/${escuelaADesactivar.id}`,
        MENSAJE_ERROR_DESACTIVAR
      );
      await refrescarEscuelas();
      toast.success("Escuela desactivada");
    } catch (e) {
      setErrorDesactivar(
        e instanceof Error ? e.message : MENSAJE_ERROR_DESACTIVAR
      );
    } finally {
      setEscuelaADesactivar(null);
    }
  };

  const requerido = (mensaje: string) => (valor: string) =>
    valor.trim() !== "" || mensaje;

  const columnas: ColumnDef<EscuelaConRegion>[] = [
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
                  onClick={() => setEscuelaADesactivar(row.original)}
                />
              </div>
            ),
          } satisfies ColumnDef<EscuelaConRegion>,
        ]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0">
        <BarraSeccion
          texto={escuelas && textoConteo(escuelas.length, "escuela", "escuelas")}
          accion={
            puedeGestionar && (
              <Boton variante="acento" tamano="sm" onClick={abrirCrear}>
                <Plus className="h-4 w-4" />
                Nueva escuela
              </Boton>
            )
          }
        />
      </div>
      {errorDesactivar && <Alerta variante="error">{errorDesactivar}</Alerta>}
      {error ? (
        <ErrorCarga
          mensaje="No se pudieron cargar las escuelas"
          onReintentar={() => void refrescarEscuelas()}
        />
      ) : (
        <Tabla columnas={columnas} datos={filas} cargando={isLoading} />
      )}

      <DialogoConfirmacion
        abierto={escuelaADesactivar !== null}
        onCerrar={() => setEscuelaADesactivar(null)}
        onConfirmar={desactivarEscuela}
        titulo="Desactivar escuela"
        descripcion={`Se desactivará la escuela "${escuelaADesactivarMostrada?.nombre ?? ""}". No podrá usarse para nuevas actas mientras esté inactiva.`}
        etiquetaConfirmar="Desactivar"
        variante="peligro"
      />

      <ModalFormulario
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? "Editar escuela" : "Nueva escuela"}
        textoEnviar={editando ? "Guardar cambios" : "Crear escuela"}
        onEnviar={() => handleSubmit(guardarEscuela)()}
      >
        {!editando && (
          <Controller
            name="regionId"
            control={control}
            rules={{ validate: requerido("La región es requerida") }}
            render={({ field }) => (
              <Selector
                label="Región"
                requerido
                autoFocus={regionFija === undefined}
                placeholder="Seleccione una región"
                opciones={opcionesRegion}
                disabled={regionFija !== undefined}
                error={formState.errors.regionId?.message}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(evento) => field.onChange(evento.target.value)}
              />
            )}
          />
        )}
        <Campo
          label="Código MEP"
          requerido
          autoFocus={editando || regionFija !== undefined}
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
