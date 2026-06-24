import { NextResponse, NextRequest } from "next/server";
import { crearServicioGraduaciones } from "@/server/servicios/graduaciones.servicio";
import * as repositorio from "@/server/repositorios/graduaciones.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

const db = clienteDb();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioGraduaciones({
    buscarGraduaciones: (p) => repositorio.buscarGraduaciones(db, p),
    obtenerGraduacionPorId: (i) => repositorio.obtenerGraduacionPorId(db, i),
  });

  try {
    const resultado = await servicio.obtenerPorId(Number(id));
    return NextResponse.json(resultado);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      return NextResponse.json(
        { error: "Graduación no encontrada" },
        { status: 404 }
      );
    }
    throw error;
  }
}
