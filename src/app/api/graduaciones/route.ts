import { NextResponse, NextRequest } from "next/server";
import { crearServicioGraduaciones } from "@/server/servicios/graduaciones.servicio";
import * as repositorio from "@/server/repositorios/graduaciones.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

const db = clienteDb();

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const identificacion = searchParams.get("identificacion") ?? undefined;
  const nombre = searchParams.get("nombre") ?? undefined;
  const escuelaId = searchParams.get("escuelaId")
    ? Number(searchParams.get("escuelaId"))
    : undefined;

  const servicio = crearServicioGraduaciones({
    buscarGraduaciones: (params) =>
      repositorio.buscarGraduaciones(db, params),
    obtenerGraduacionPorId: (id) =>
      repositorio.obtenerGraduacionPorId(db, id),
  });

  const resultados = await servicio.buscar({
    identificacion,
    nombre,
    escuelaId,
  });

  return NextResponse.json(resultados);
}
