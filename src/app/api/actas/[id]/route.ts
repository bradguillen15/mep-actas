import { NextResponse, NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

type Parametros = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioActasDesdeDb(clienteDb());

  try {
    const resultado = await servicio.obtenerActaPorId(
      Number(id),
      derivarAmbitoConsulta(sesion)
    );
    return NextResponse.json(resultado);
  } catch (error) {
    return responderErrorDeRecurso(error, "Acta no encontrada");
  }
}

export async function PATCH(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const { id } = await params;
  const json = await request.json();
  const servicio = crearServicioActasDesdeDb(clienteDb());

  try {
    const acta = await servicio.actualizarActa(Number(id), json, sesion);
    if (!acta) {
      return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(acta);
  } catch (error) {
    return responderErrorDeRecurso(error, "Acta no encontrada");
  }
}
