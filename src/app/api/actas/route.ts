import { NextResponse, NextRequest } from "next/server";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";
import { ambitoDeEscuelaObjetivo, derivarAmbitoConsulta } from "@/server/auth/ambito";
import { resolverAmbitoDeEscuela } from "@/server/repositorios/escuelas.repositorio";

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const escuelaId = searchParams.get("escuelaId")
    ? Number(searchParams.get("escuelaId"))
    : undefined;
  const tipoActaId = searchParams.get("tipoActaId")
    ? Number(searchParams.get("tipoActaId"))
    : undefined;
  const tomo = searchParams.get("tomo")
    ? Number(searchParams.get("tomo"))
    : undefined;

  const servicio = crearServicioActasDesdeDb(clienteDb());
  const actas = await servicio.listarActas(
    { escuelaId, tipoActaId, tomo },
    derivarAmbitoConsulta(sesion)
  );
  return NextResponse.json(actas);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 4);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const json = await request.json();

  const db = clienteDb();
  const ambitoObjetivo = await ambitoDeEscuelaObjetivo(
    sesion,
    Number(json.escuelaId),
    (escuelaId) => resolverAmbitoDeEscuela(db, escuelaId)
  );
  const verificacionAmbito = verificarRol(sesion, 4, ambitoObjetivo);
  if (!verificacionAmbito.autorizado) {
    return respuestaNoAutorizada(verificacionAmbito);
  }

  const servicio = crearServicioActasDesdeDb(db);
  const { estudiantes, ...datosActa } = json;

  if (Array.isArray(estudiantes) && estudiantes.length > 0) {
    try {
      const acta = await servicio.crearActaConEstudiantes(
        datosActa,
        estudiantes,
        sesion
      );
      return NextResponse.json(acta, { status: 201 });
    } catch (error) {
      return responderErrorDeRecurso(error, "Acta no encontrada");
    }
  }

  const acta = await servicio.crearActa(datosActa, sesion);
  return NextResponse.json(acta, { status: 201 });
}
