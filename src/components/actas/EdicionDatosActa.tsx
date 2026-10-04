"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { toast } from "@/components/ui/Notificaciones";
import { patchJson } from "@/lib/api-cliente";
import { construirCuerpoActa, crearActa } from "@/lib/actas-cliente";
import { CamposActa } from "./CamposActa";
import { Seccion } from "./Seccion";
import type { ActaDetallada, ValoresFormularioActa } from "./tipos";

interface EdicionDatosActaProps {
  acta?: ActaDetallada;
  escuelaFijaId?: number;
  tiposActa: { id: number; nombre: string }[];
  escuelas: { id: number; nombre: string }[];
  puedeElegirEscuela: boolean;
  onActualizado?: () => Promise<unknown> | void;
  onCreada?: (id: number) => void;
}

const CAMPOS: (keyof ValoresFormularioActa)[] = [
  "escuelaId",
  "tipoActaId",
  "titulo",
  "numeroTomo",
  "folioInicio",
  "folioFin",
  "fecha",
  "actaReferenciaId",
];

const VALORES_NUEVA_ACTA: ValoresFormularioActa = {
  escuelaId: "",
  tipoActaId: "",
  titulo: "",
  numeroTomo: "",
  folioInicio: "",
  folioFin: "",
  fecha: new Date().toISOString().split("T")[0],
  actaReferenciaId: "",
};

type EstadoGuardado =
  | { tipo: "inactivo" }
  | { tipo: "guardando" }
  | { tipo: "guardado" }
  | { tipo: "error"; mensaje: string };

function valoresDesdeActa(acta: ActaDetallada): ValoresFormularioActa {
  return {
    escuelaId: String(acta.escuelaId),
    tipoActaId: String(acta.tipoActaId),
    titulo: acta.titulo,
    numeroTomo: String(acta.numeroTomo),
    folioInicio: String(acta.folioInicio),
    folioFin: String(acta.folioFin),
    fecha: acta.fecha.split("T")[0],
    actaReferenciaId: acta.actaReferenciaId ? String(acta.actaReferenciaId) : "",
  };
}

function IndicadorGuardado({ estado }: { estado: EstadoGuardado }) {
  const texto =
    estado.tipo === "guardando"
      ? "Guardando…"
      : estado.tipo === "guardado"
        ? "Cambios guardados"
        : estado.tipo === "error"
          ? estado.mensaje
          : "";
  return (
    <span
      role="status"
      className={
        estado.tipo === "error" ? "text-xs text-error" : "text-xs text-texto-suave"
      }
    >
      {texto}
    </span>
  );
}

export function EdicionDatosActa({
  acta,
  escuelaFijaId,
  tiposActa,
  escuelas,
  puedeElegirEscuela,
  onActualizado,
  onCreada,
}: EdicionDatosActaProps) {
  const valoresIniciales = acta ? valoresDesdeActa(acta) : VALORES_NUEVA_ACTA;
  const [estado, setEstado] = useState<EstadoGuardado>({ tipo: "inactivo" });
  const ultimoGuardado = useRef(JSON.stringify(valoresIniciales));
  const guardandoAhora = useRef(false);
  const hayPendiente = useRef(false);
  const yaCreada = useRef(false);

  const {
    register,
    control,
    getValues,
    getFieldState,
    clearErrors,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ValoresFormularioActa>({
    mode: "onBlur",
    defaultValues: valoresIniciales,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const tipoActaId = watch("tipoActaId");

  const guardarSiCorresponde = async () => {
    if (yaCreada.current) return;
    if (guardandoAhora.current) {
      hayPendiente.current = true;
      return;
    }
    const valido = await trigger();
    if (!valido) {
      if (!acta) {
        for (const campo of CAMPOS) {
          if (!getFieldState(campo).isTouched) clearErrors(campo);
        }
      }
      return;
    }

    const datos = getValues();
    const firma = JSON.stringify(datos);
    if (firma === ultimoGuardado.current) return;

    const escuelaId = puedeElegirEscuela
      ? Number(datos.escuelaId)
      : (acta?.escuelaId ?? escuelaFijaId);
    if (escuelaId === undefined) return;

    guardandoAhora.current = true;
    setEstado({ tipo: "guardando" });
    const cuerpo = construirCuerpoActa(datos, escuelaId);
    const actaReferenciaId = datos.actaReferenciaId
      ? Number(datos.actaReferenciaId)
      : null;
    try {
      if (acta) {
        await patchJson(
          `/api/actas/${acta.id}`,
          { ...cuerpo, actaReferenciaId },
          "Error al actualizar el acta"
        );
        ultimoGuardado.current = firma;
        setEstado({ tipo: "guardado" });
        await onActualizado?.();
      } else {
        const { id } = await crearActa({
          ...cuerpo,
          ...(actaReferenciaId === null ? {} : { actaReferenciaId }),
        });
        yaCreada.current = true;
        toast.success("Acta creada");
        onCreada?.(id);
      }
    } catch (e) {
      setEstado({
        tipo: "error",
        mensaje: e instanceof Error ? e.message : "Error al guardar el acta",
      });
    } finally {
      guardandoAhora.current = false;
      if (hayPendiente.current) {
        hayPendiente.current = false;
        void guardarSiCorresponde();
      }
    }
  };

  return (
    <Seccion
      titulo="Datos del acta"
      acciones={<IndicadorGuardado estado={estado} />}
    >
      <div className="min-h-0 overflow-y-auto" onBlur={() => void guardarSiCorresponde()}>
        <CamposActa
          register={register}
          control={control}
          errors={errors}
          tiposActa={tiposActa}
          escuelas={escuelas}
          puedeElegirEscuela={puedeElegirEscuela}
          tipoActaId={tipoActaId}
          alCambiarSelector={() => void guardarSiCorresponde()}
        />
      </div>
    </Seccion>
  );
}
