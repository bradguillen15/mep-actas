import { NextResponse, NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";

type Parametros = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioActasDesdeDb(clienteDb());

  try {
    const estudiantes = await servicio.listarEstudiantesDeActa(
      Number(id),
      derivarAmbitoConsulta(sesion)
    );
    return NextResponse.json(estudiantes);
  } catch (error) {
    return responderErrorDeRecurso(error, "Acta no encontrada");
  }
}

export async function POST(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 4);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const { id } = await params;
  const json = await request.json();
  const servicio = crearServicioActasDesdeDb(clienteDb());

  try {
    const resultado = await servicio.agregarEstudiante(
      Number(id),
      json.personaId,
      json.numeroCertificado,
      sesion
    );
    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return responderErrorDeRecurso(error, "Acta no encontrada");
  }
}
