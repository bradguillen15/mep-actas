import { NextResponse } from "next/server";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as esquema from "@/db/esquema";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioRegiones } from "@/server/servicios/regiones.servicio";
import * as repositorio from "@/server/repositorios/regiones.repositorio";
import { NIVELES } from "@/server/auth/tipos";

type Db = LibSQLDatabase<typeof esquema>;
type RouteParams = Promise<{ id: string }>;

function crearServicio(db: Db) {
  const auditor = crearAuditor(db);
  return crearServicioRegiones(
    {
      listarRegiones: () => repositorio.listarRegiones(db),
      obtenerRegionPorId: (id: number) => repositorio.obtenerRegionPorId(db, id),
      crearRegion: (datos) => repositorio.crearRegion(db, datos),
      actualizarRegion: (id, datos) => repositorio.actualizarRegion(db, id, datos),
      desactivarRegion: (id) => repositorio.desactivarRegion(db, id),
      contarEscuelasActivas: (regionId) => repositorio.contarEscuelasActivas(db, regionId),
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

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const region = await servicio.actualizarRegion(
      regionId,
      { nombre: nombre.trim() },
      sesion
    );

    if (!region) {
      return NextResponse.json(
        { error: "Región no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(region);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al actualizar la región";
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

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const region = await servicio.desactivarRegion(regionId, sesion);

    if (!region) {
      return NextResponse.json(
        { error: "Región no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(region);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al desactivar la región";
    const status = mensaje.includes("no encontrada")
      ? 404
      : mensaje.includes("escuelas activas")
        ? 409
        : 400;
    return NextResponse.json({ error: mensaje }, { status });
  }
}
