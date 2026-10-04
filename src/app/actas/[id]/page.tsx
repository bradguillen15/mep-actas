"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { DetalleActa } from "@/components/actas/DetalleActa";
import type { ActaDetallada, EstudianteRegistrado } from "@/components/actas/tipos";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { useEscuelaActual } from "@/hooks/useEscuelaActual";
import { obtenerJsonEstricto } from "@/lib/api-cliente";

interface TipoActa {
  id: number;
  nombre: string;
}

interface ActaDetalle {
  acta: ActaDetallada;
  estudiantes: EstudianteRegistrado[];
}

function EsqueletoFormulario() {
  return (
    <div role="status" aria-label="Cargando acta" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
    </div>
  );
}

export default function VerActa() {
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

  const hayError = !idValido || errorDetalle || errorTipos;
  const listo = detalle && tiposActa && !cargandoEscuelas;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 overflow-y-auto">
      <EncabezadoPagina
        titulo="Acta"
        descripcion="Datos del acta y sus estudiantes."
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
        <DetalleActa
          acta={detalle.acta}
          estudiantes={detalle.estudiantes}
          tiposActa={tiposActa}
          escuelas={escuelas}
          puedeElegirEscuela={puedeElegirEscuela}
          onActualizado={() => mutate()}
        />
      )}
    </div>
  );
}
