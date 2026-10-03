"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  FormularioActa,
  type ValoresFormularioActa,
} from "@/components/actas/FormularioActa";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { toast } from "@/components/ui/Notificaciones";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { obtenerJsonEstricto } from "@/lib/api-cliente";
import {
  construirCuerpoActa,
  crearActaConEstudiantes,
} from "@/lib/actas-cliente";

interface TipoActa {
  id: number;
  nombre: string;
}

export default function NuevaActa() {
  const router = useRouter();
  const { escuelaId, puedeElegirEscuela, escuelas, isLoading } =
    useEscuelaActual();

  const {
    data: tiposActa,
    error,
    mutate,
  } = useSWR<TipoActa[]>("/api/tipos-acta", obtenerJsonEstricto);

  const guardar = async (datos: ValoresFormularioActa, escuelaDestino: number) => {
    const cuerpo = {
      ...construirCuerpoActa(datos, escuelaDestino),
      ...(datos.actaReferenciaId
        ? { actaReferenciaId: Number(datos.actaReferenciaId) }
        : {}),
    };

    await crearActaConEstudiantes(cuerpo, datos.estudiantes);

    toast.success("Acta creada");
    router.push("/actas");
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto">
      <EncabezadoPagina
        titulo="Nueva acta"
        descripcion="Registre un acta de graduación con sus estudiantes asociados."
        volverA={{ href: "/actas", etiqueta: "Volver a actas" }}
      />

      {error ? (
        <EstadoVacio
          variante="error"
          mensaje="No se pudo cargar el formulario"
          descripcion="Ocurrió un problema al consultar los tipos de acta. Intente de nuevo."
          accion={
            <Boton type="button" variante="secundario" onClick={() => mutate()}>
              Reintentar
            </Boton>
          }
        />
      ) : !tiposActa || isLoading ? (
        <Tarjeta>
          <div role="status" aria-label="Cargando formulario" className="flex flex-col gap-4">
            <Esqueleto className="h-10 w-full" />
            <Esqueleto className="h-10 w-full" />
            <Esqueleto className="h-10 w-2/3" />
          </div>
        </Tarjeta>
      ) : (
        <FormularioActa
          modo="crear"
          tiposActa={tiposActa}
          escuelas={escuelas}
          puedeElegirEscuela={puedeElegirEscuela}
          escuelaFijaId={escuelaId}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}
