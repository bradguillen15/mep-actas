import { NextResponse } from "next/server";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearServicioRegionesDesdeDb } from "@/server/servicios/regiones.fabrica";
import { NIVELES } from "@/server/auth/tipos";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const servicio = crearServicioRegionesDesdeDb(clienteDb());
  const regiones = await servicio.listarRegiones();

  return NextResponse.json(regiones);
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_PAIS);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para crear regiones" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la región es requerido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioRegionesDesdeDb(clienteDb());
    const region = await servicio.crearRegion(
      { nombre: nombre.trim() },
      sesion
    );

    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    return responderErrorDeRecurso(error, "Región no encontrada");
  }
}
