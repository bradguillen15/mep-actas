import { NextResponse, NextRequest } from "next/server";
import { crearServicioGraduacionesDesdeDb } from "@/server/servicios/graduaciones.fabrica";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioGraduacionesDesdeDb(clienteDb());

  try {
    const resultado = await servicio.obtenerPorId(
      Number(id),
      derivarAmbitoConsulta(sesion)
    );
    return NextResponse.json(resultado);
  } catch (error) {
    return responderErrorDeRecurso(error, "Graduación no encontrada");
  }
}
