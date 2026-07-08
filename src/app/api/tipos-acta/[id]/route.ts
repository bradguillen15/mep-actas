import { NextResponse } from "next/server";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as esquema from "@/db/esquema";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { clienteDb } from "@/db/cliente";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioTiposActa } from "@/server/servicios/tipos-acta.servicio";
import * as repositorio from "@/server/repositorios/tipos-acta.repositorio";

type Db = LibSQLDatabase<typeof esquema>;
type RouteParams = Promise<{ id: string }>;

function crearServicio(db: Db) {
  const auditor = crearAuditor(db);
  return crearServicioTiposActa(
    {
      obtenerTipoActaPorId: (id) => repositorio.obtenerTipoActaPorId(db, id),
      desactivarTipoActa: (id) => repositorio.desactivarTipoActa(db, id),
      contarActasPorTipo: (tipoActaId) =>
        repositorio.contarActasPorTipo(db, tipoActaId),
    },
    auditor
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const tipoActaId = Number(id);
    if (Number.isNaN(tipoActaId)) {
      return NextResponse.json(
        { error: "ID de tipo de acta inválido" },
        { status: 400 }
      );
    }

    const db = clienteDb() as Db;
    const servicio = crearServicio(db);
    const tipo = await servicio.desactivarTipoActa(tipoActaId, sesion);

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de acta no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(tipo);
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "Error al eliminar el tipo de acta";
    const status = mensaje.includes("no encontrado")
      ? 404
      : mensaje.includes("actas asociadas")
        ? 409
        : 400;
    return NextResponse.json({ error: mensaje }, { status });
  }
}
