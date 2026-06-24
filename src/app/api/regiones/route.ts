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

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = clienteDb() as Db;
  const servicio = crearServicio(db);
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

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const region = await servicio.crearRegion(
      { nombre: nombre.trim() },
      sesion
    );

    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al crear la región";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
