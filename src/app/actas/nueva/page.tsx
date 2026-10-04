"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { DetalleActa } from "@/components/actas/DetalleActa";
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

export default function NuevaActa() {
  const router = useRouter();
  const { escuelaId, puedeElegirEscuela, escuelas, isLoading } =
    useEscuelaActual();

  const {
    data: tiposActa,
    error,
    mutate,
  } = useSWR<TipoActa[]>("/api/tipos-acta", obtenerJsonEstricto);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 overflow-y-auto">
      <EncabezadoPagina
        titulo="Nueva acta"
        descripcion="Datos del acta y sus estudiantes."
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
        <div role="status" aria-label="Cargando formulario" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Tarjeta>
            <Esqueleto className="h-10 w-full" />
          </Tarjeta>
          <Tarjeta>
            <Esqueleto className="h-24 w-full" />
          </Tarjeta>
        </div>
      ) : (
        <DetalleActa
          tiposActa={tiposActa}
          escuelas={escuelas}
          puedeElegirEscuela={puedeElegirEscuela}
          escuelaFijaId={escuelaId}
          onCreada={(id) => router.replace(`/actas/${id}`)}
        />
      )}
    </div>
  );
}
