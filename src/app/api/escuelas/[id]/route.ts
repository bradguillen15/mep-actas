import { NextResponse } from "next/server";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as esquema from "@/db/esquema";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioEscuelas } from "@/server/servicios/escuelas.servicio";
import * as repositorio from "@/server/repositorios/escuelas.repositorio";
import { NIVELES } from "@/server/auth/tipos";

type Db = LibSQLDatabase<typeof esquema>;
type RouteParams = Promise<{ id: string }>;

function crearServicio(db: Db) {
  const auditor = crearAuditor(db);
  return crearServicioEscuelas(
    {
      listarEscuelas: (filtros) => repositorio.listarEscuelas(db, filtros),
      obtenerEscuelaPorId: (id) => repositorio.obtenerEscuelaPorId(db, id),
      crearEscuela: (datos) => repositorio.crearEscuela(db, datos),
      actualizarEscuela: (id, datos) => repositorio.actualizarEscuela(db, id, datos),
      desactivarEscuela: (id) => repositorio.desactivarEscuela(db, id),
      contarActasActivas: (id) => repositorio.contarActasActivas(db, id),
    },
    auditor
  );
}

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

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const escuela = await servicio.actualizarEscuela(escuelaId, datos, sesion);

    if (!escuela) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(escuela);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al actualizar la escuela";
    const status = mensaje.includes("no encontrada") ? 404 : 400;
    return NextResponse.json({ error: mensaje }, { status });
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

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const escuela = await servicio.desactivarEscuela(escuelaId, sesion);

    if (!escuela) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(escuela);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al desactivar la escuela";
    const status = mensaje.includes("no encontrada")
      ? 404
      : mensaje.includes("actas activas")
        ? 409
        : 400;
    return NextResponse.json({ error: mensaje }, { status });
  }
}
