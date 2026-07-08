import { NextRequest, NextResponse } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioEscaneos } from "@/server/servicios/escaneos.servicio";
import * as repositorio from "@/server/repositorios/escaneos.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

async function crearServicio() {
  const db = clienteDb();
  const auditor = crearAuditor(db);
  return crearServicioEscaneos(
    {
      listarEscaneos: (filtros) =>
        repositorio.listarEscaneos(db, filtros),
      obtenerEscaneoPorId: (id) =>
        repositorio.obtenerEscaneoPorId(db, id),
      crearEscaneo: (datos) =>
        repositorio.crearEscaneo(db, datos),
      eliminarEscaneo: (id) =>
        repositorio.eliminarEscaneo(db, id),
    },
    auditor
  );
}

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

  const servicio = await crearServicio();
  const escaneos = await servicio.listarConUrlLectura({
    escuelaId,
    tomo,
  });

  return NextResponse.json(escaneos);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const cuerpo = await request.json();
  const servicio = await crearServicio();

  try {
    const resultado = await servicio.prepararSubida(cuerpo, sesion);
    return NextResponse.json(resultado, { status: 201 });
  } catch (e) {
    const mensaje =
      e instanceof Error ? e.message : "Error al preparar subida";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
