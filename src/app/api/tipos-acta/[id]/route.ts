import { NextResponse } from "next/server";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { NIVELES } from "@/server/auth/tipos";
import { clienteDb } from "@/db/cliente";
import { crearServicioTiposActaDesdeDb } from "@/server/servicios/tipos-acta.fabrica";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";

type RouteParams = Promise<{ id: string }>;

const NO_ENCONTRADO = "Tipo de acta no encontrado";

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_ESCUELA);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  try {
    const { id } = await params;
    const tipoActaId = Number(id);
    if (Number.isNaN(tipoActaId)) {
      return NextResponse.json(
        { error: "ID de tipo de acta inválido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioTiposActaDesdeDb(clienteDb());
    const tipo = await servicio.desactivarTipoActa(tipoActaId, sesion);

    if (!tipo) {
      return NextResponse.json({ error: NO_ENCONTRADO }, { status: 404 });
    }

    return NextResponse.json(tipo);
  } catch (error) {
    return responderErrorDeRecurso(error, NO_ENCONTRADO);
  }
}
