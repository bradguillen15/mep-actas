import { NextResponse, NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { NIVELES } from "@/server/auth/tipos";
import { crearServicioTiposActaDesdeDb } from "@/server/servicios/tipos-acta.fabrica";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const servicio = crearServicioTiposActaDesdeDb(clienteDb());
  const tipos = await servicio.listarTiposActa();
  return NextResponse.json(tipos);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_ESCUELA);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const { nombre } = await request.json();
  const servicio = crearServicioTiposActaDesdeDb(clienteDb());

  try {
    const tipo = await servicio.crearTipoActa({ nombre }, sesion);
    return NextResponse.json(tipo, { status: 201 });
  } catch (error) {
    return responderErrorDeRecurso(error, "Tipo de acta no encontrado");
  }
}
