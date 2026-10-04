import { NextResponse } from "next/server";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearServicioEscuelasDesdeDb } from "@/server/servicios/escuelas.fabrica";
import { NIVELES } from "@/server/auth/tipos";
import { responderErrorDeRecurso } from "@/server/http/respuestas";

type RouteParams = Promise<{ id: string }>;

const NO_ENCONTRADA = "Escuela no encontrada";

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_REGIONAL);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para editar escuelas" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const escuelaId = Number(id);
    if (Number.isNaN(escuelaId)) {
      return NextResponse.json(
        { error: "ID de escuela inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const datos: { nombre?: string; codigoMep?: string } = {};

    if (body.nombre !== undefined) {
      if (typeof body.nombre !== "string" || body.nombre.trim().length === 0) {
        return NextResponse.json(
          { error: "El nombre de la escuela no puede estar vacío" },
          { status: 400 }
        );
      }
      datos.nombre = body.nombre.trim();
    }

    if (body.codigoMep !== undefined) {
      if (
        typeof body.codigoMep !== "string" ||
        body.codigoMep.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "El código MEP no puede estar vacío" },
          { status: 400 }
        );
      }
      datos.codigoMep = body.codigoMep.trim();
    }

    if (Object.keys(datos).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    const servicio = crearServicioEscuelasDesdeDb(clienteDb());
    const escuela = await servicio.actualizarEscuela(escuelaId, datos, sesion);

    if (!escuela) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 });
    }

    return NextResponse.json(escuela);
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

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_REGIONAL);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para desactivar escuelas" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const escuelaId = Number(id);
    if (Number.isNaN(escuelaId)) {
      return NextResponse.json(
        { error: "ID de escuela inválido" },
        { status: 400 }
      );
    }

    const servicio = crearServicioEscuelasDesdeDb(clienteDb());
    const escuela = await servicio.desactivarEscuela(escuelaId, sesion);

    if (!escuela) {
      return NextResponse.json({ error: NO_ENCONTRADA }, { status: 404 });
    }

    return NextResponse.json(escuela);
  } catch (error) {
    return responderErrorDeRecurso(error, NO_ENCONTRADA);
  }
}
