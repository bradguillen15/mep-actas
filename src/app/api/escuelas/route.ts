import { NextResponse } from "next/server";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearServicioEscuelasDesdeDb } from "@/server/servicios/escuelas.fabrica";
import { NIVELES } from "@/server/auth/tipos";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

export async function GET(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const servicio = crearServicioEscuelasDesdeDb(clienteDb());

  const { searchParams } = new URL(request.url);
  const regionIdParam = searchParams.get("region_id");
  const filtros = regionIdParam
    ? { regionId: Number(regionIdParam) }
    : undefined;

  const escuelas = await servicio.listarEscuelas(filtros);

  return NextResponse.json(escuelas);
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_REGIONAL);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para crear escuelas" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { regionId, codigoMep, nombre } = body;

    if (!regionId || typeof regionId !== "number") {
      return NextResponse.json(
        { error: "El ID de la región es requerido" },
        { status: 400 }
      );
    }

    if (!codigoMep || typeof codigoMep !== "string" || codigoMep.trim().length === 0) {
      return NextResponse.json(
        { error: "El código MEP es requerido" },
        { status: 400 }
      );
    }

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la escuela es requerido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioEscuelasDesdeDb(clienteDb());
    const escuela = await servicio.crearEscuela(
      { regionId, codigoMep: codigoMep.trim(), nombre: nombre.trim() },
      sesion
    );

    return NextResponse.json(escuela, { status: 201 });
  } catch (error) {
    return responderErrorDeRecurso(error, "Escuela no encontrada");
  }
}
