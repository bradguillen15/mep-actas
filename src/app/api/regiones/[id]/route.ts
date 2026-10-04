import { NextResponse } from "next/server";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearServicioRegionesDesdeDb } from "@/server/servicios/regiones.fabrica";
import { NIVELES } from "@/server/auth/tipos";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

type RouteParams = Promise<{ id: string }>;

const NO_ENCONTRADA = "Región no encontrada";

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_PAIS);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para editar regiones" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const regionId = Number(id);
    if (Number.isNaN(regionId)) {
      return NextResponse.json(
        { error: "ID de región inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la región es requerido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioRegionesDesdeDb(clienteDb());
    const region = await servicio.actualizarRegion(
      regionId,
      { nombre: nombre.trim() },
      sesion
    );

    if (!region) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    return responderErrorDeRecurso(error, NO_ENCONTRADA);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_PAIS);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para desactivar regiones" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const regionId = Number(id);
    if (Number.isNaN(regionId)) {
      return NextResponse.json(
        { error: "ID de región inválido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioRegionesDesdeDb(clienteDb());
    const region = await servicio.desactivarRegion(regionId, sesion);

    if (!region) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    return responderErrorDeRecurso(error, NO_ENCONTRADA);
  }
}
