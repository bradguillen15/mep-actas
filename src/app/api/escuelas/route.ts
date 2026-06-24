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

export async function GET(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = clienteDb() as Db;
  const servicio = crearServicio(db);

  const { searchParams } = new URL(request.url);
  const regionIdParam = searchParams.get("region_id");
  const filtros = regionIdParam
    ? { regionId: Number(regionIdParam) }
    : undefined;

  const escuelas = await servicio.listarEscuelas(filtros);

  return NextResponse.json(escuelas);
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, NIVELES.ADMIN_REGIONAL);
  if (!verificacion.autorizado) {
    return NextResponse.json(
      { error: "No tiene permisos para crear escuelas" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { regionId, codigoMep, nombre } = body;

    if (!regionId || typeof regionId !== "number") {
      return NextResponse.json(
        { error: "El ID de la región es requerido" },
        { status: 400 }
      );
    }

    if (!codigoMep || typeof codigoMep !== "string" || codigoMep.trim().length === 0) {
      return NextResponse.json(
        { error: "El código MEP es requerido" },
        { status: 400 }
      );
    }

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la escuela es requerido" },
        { status: 400 }
      );
    }

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const escuela = await servicio.crearEscuela(
      { regionId, codigoMep: codigoMep.trim(), nombre: nombre.trim() },
      sesion
    );

    return NextResponse.json(escuela, { status: 201 });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al crear la escuela";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
