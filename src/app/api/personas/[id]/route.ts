import { NextRequest, NextResponse } from "next/server";
import { crearServicioPersonasDesdeDb } from "@/server/servicios/personas.fabrica";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioPersonasDesdeDb(clienteDb());
  const persona = await servicio.obtenerPersonaPorId(
    Number(id),
    derivarAmbitoConsulta(sesion)
  );

  if (!persona) {
    return NextResponse.json(
      { error: "Persona no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(persona);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const { id } = await params;
  const cuerpo = await request.json();
  const servicio = crearServicioPersonasDesdeDb(clienteDb());

  try {
    const persona = await servicio.actualizarPersona(Number(id), cuerpo, sesion);
    if (!persona) {
      return NextResponse.json(
        { error: "Persona no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(persona);
  } catch (e) {
    if (e instanceof Error && e.name === "NotFoundError") {
      return responderErrorDeRecurso(e, "Persona no encontrada");
    }
    const mensaje =
      e instanceof Error ? e.message : "Error al actualizar persona";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
