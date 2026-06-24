import { NextRequest, NextResponse } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioEscaneos } from "@/server/servicios/escaneos.servicio";
import * as repositorio from "@/server/repositorios/escaneos.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";

async function crearServicio() {
  const db = clienteDb();
  const auditor = crearAuditor(db);
  return crearServicioEscaneos(
    {
      listarEscaneos: (filtros) =>
        repositorio.listarEscaneos(db, filtros),
      obtenerEscaneoPorId: (id) =>
        repositorio.obtenerEscaneoPorId(db, id),
      crearEscaneo: (datos) =>
        repositorio.crearEscaneo(db, datos),
      eliminarEscaneo: (id) =>
        repositorio.eliminarEscaneo(db, id),
    },
    auditor
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = await crearServicio();
  const escaneo = await servicio.obtenerEscaneoPorId(Number(id));

  if (!escaneo) {
    return NextResponse.json(
      { error: "Escaneo no encontrado" },
      { status: 404 }
    );
  }

  const url = await servicio.generarUrlLectura(Number(id));
  return NextResponse.json({ ...escaneo, urlLectura: url });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = await crearServicio();
  const escaneo = await servicio.eliminarEscaneo(Number(id), sesion);

  if (!escaneo) {
    return NextResponse.json(
      { error: "Escaneo no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(escaneo);
}
