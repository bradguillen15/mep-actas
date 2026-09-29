import { NextRequest, NextResponse } from "next/server";
import { crearServicioEscaneosDesdeDb } from "@/server/servicios/escaneos.fabrica";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
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
  const tomo = searchParams.get("tomo")
    ? Number(searchParams.get("tomo"))
    : undefined;

  const servicio = crearServicioEscaneosDesdeDb(clienteDb());
  const escaneos = await servicio.listarConUrlLectura(
    { escuelaId, tomo },
    derivarAmbitoConsulta(sesion)
  );

  return NextResponse.json(escaneos);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 4);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const cuerpo = await request.json();

  const db = clienteDb();
  const ambitoObjetivo = await ambitoDeEscuelaObjetivo(
    sesion,
    Number(cuerpo.escuelaId),
    (escuelaId) => resolverAmbitoDeEscuela(db, escuelaId)
  );
  const verificacionAmbito = verificarRol(sesion, 4, ambitoObjetivo);
  if (!verificacionAmbito.autorizado) {
    return NextResponse.json(
      { error: verificacionAmbito.error },
      { status: 403 }
    );
  }

  const servicio = crearServicioEscaneosDesdeDb(db);

  try {
    const resultado = await servicio.prepararSubida(cuerpo, sesion);
    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensaje =
      e instanceof Error ? e.message : "Error al preparar subida";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
