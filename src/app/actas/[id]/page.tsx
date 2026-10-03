"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  FormularioActa,
  type EstudianteRegistrado,
  type ValoresFormularioActa,
} from "@/components/actas/FormularioActa";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { toast } from "@/components/ui/Notificaciones";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { obtenerJsonEstricto, patchJson } from "@/lib/api-cliente";
import {
  agregarEstudiantesAlActa,
  construirCuerpoActa,
} from "@/lib/actas-cliente";

interface TipoActa {
  id: number;
  nombre: string;
}

interface ActaDetalle {
  acta: {
    id: number;
    escuelaId: number;
    tipoActaId: number;
    titulo: string;
    numeroTomo: number;
    folioInicio: number;
    folioFin: number;
    fecha: string;
    actaReferenciaId: number | null;
  };
  estudiantes: EstudianteRegistrado[];
}

function EsqueletoFormulario() {
  return (
    <div role="status" aria-label="Cargando acta" className="flex flex-col gap-6">
      <Tarjeta>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-10 w-full" />
          ))}
        </div>
      </Tarjeta>
      <Tarjeta>
        <Esqueleto className="h-24 w-full" />
      </Tarjeta>
    </div>
  );
}

export default function EditarActa() {
  const router = useRouter();
  const params = useParams();
  const actaId = Number(params.id);
  const idValido = Number.isInteger(actaId) && actaId > 0;
  const { puedeElegirEscuela, escuelas, isLoading: cargandoEscuelas } =
    useEscuelaActual();

  const { data: tiposActa, error: errorTipos } = useSWR<TipoActa[]>(
    "/api/tipos-acta",
    obtenerJsonEstricto
  );
  const {
    data: detalle,
    error: errorDetalle,
    mutate,
  } = useSWR<ActaDetalle>(
    idValido ? `/api/actas/${actaId}` : null,
    obtenerJsonEstricto
  );

  const guardar = async (datos: ValoresFormularioActa, escuelaId: number) => {
    const cuerpo = {
      ...construirCuerpoActa(datos, escuelaId),
      actaReferenciaId: datos.actaReferenciaId
        ? Number(datos.actaReferenciaId)
        : null,
    };

    await patchJson(`/api/actas/${actaId}`, cuerpo, "Error al actualizar acta");
    await agregarEstudiantesAlActa(actaId, datos.estudiantes);

    toast.success("Acta actualizada");
    router.push("/actas");
  };

  const hayError = !idValido || errorDetalle || errorTipos;
  const listo = detalle && tiposActa && !cargandoEscuelas;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto">
      <EncabezadoPagina
        titulo="Editar acta"
        descripcion="Modifique los datos del acta o agregue estudiantes adicionales."
        volverA={{ href: "/actas", etiqueta: "Volver a actas" }}
      />

      {hayError ? (
        <EstadoVacio
          variante="error"
          mensaje="No se pudo cargar el acta"
          descripcion="Es posible que no exista o que no tenga acceso a ella. Intente de nuevo."
          accion={
            <div className="flex gap-2">
              {idValido && (
                <Boton type="button" variante="secundario" onClick={() => mutate()}>
                  Reintentar
                </Boton>
              )}
              <Boton asChild variante="secundario">
                <Link href="/actas">Ver todas las actas</Link>
              </Boton>
            </div>
          }
        />
      ) : !listo ? (
        <EsqueletoFormulario />
      ) : (
        <FormularioActa
          modo="editar"
          tiposActa={tiposActa}
          escuelas={escuelas}
          puedeElegirEscuela={puedeElegirEscuela}
          escuelaFijaId={detalle.acta.escuelaId}
          estudiantesExistentes={detalle.estudiantes}
          valoresIniciales={{
            escuelaId: String(detalle.acta.escuelaId),
            tipoActaId: String(detalle.acta.tipoActaId),
            titulo: detalle.acta.titulo,
            numeroTomo: String(detalle.acta.numeroTomo),
            folioInicio: String(detalle.acta.folioInicio),
            folioFin: String(detalle.acta.folioFin),
            fecha: detalle.acta.fecha.split("T")[0],
            actaReferenciaId: detalle.acta.actaReferenciaId
              ? String(detalle.acta.actaReferenciaId)
              : "",
          }}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}
