import { NextResponse, NextRequest } from "next/server";
import { crearServicioAuditoria } from "@/server/servicios/auditoria.vistas.servicio";
import * as repositorio from "@/server/repositorios/auditoria.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

const db = clienteDb();

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 1);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get("usuarioId")
    ? Number(searchParams.get("usuarioId"))
    : undefined;
  const tabla = searchParams.get("tabla") ?? undefined;
  const accion = searchParams.get("accion") ?? undefined;
  const limite = searchParams.get("limite")
    ? Number(searchParams.get("limite"))
    : undefined;

  const servicio = crearServicioAuditoria({
    listarAuditoria: (filtros) => repositorio.listarAuditoria(db, filtros),
  });

  const registros = await servicio.listar({
    usuarioId,
    tabla,
    accion,
    limite,
  });

  return NextResponse.json(registros);
}
