import { NextResponse, NextRequest } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioActas } from "@/server/servicios/actas.servicio";
import * as actasRepositorio from "@/server/repositorios/actas.repositorio";
import * as detalleRepositorio from "@/server/repositorios/actas.detalle.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

function crearServicio() {
  const db = clienteDb();
  const auditor = crearAuditor(db);
  return crearServicioActas(
    {
      listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
      obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
      crearActa: (datos) => actasRepositorio.crearActa(db, datos),
      actualizarActa: (id, datos) =>
        actasRepositorio.actualizarActa(db, id, datos),
    },
    {
      listarEstudiantesDeActa: (actaId) =>
        detalleRepositorio.listarEstudiantesDeActa(db, actaId),
      agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
        detalleRepositorio.agregarEstudianteAActa(
          db,
          actaId,
          personaId,
          numeroCertificado
        ),
      listarFirmantesDeActa: (actaId) =>
        detalleRepositorio.listarFirmantesDeActa(db, actaId),
      agregarFirmante: (actaId, funcionarioId, rolFirma) =>
        detalleRepositorio.agregarFirmante(db, actaId, funcionarioId, rolFirma),
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
  const servicio = crearServicio();

  try {
    const resultado = await servicio.obtenerActaPorId(Number(id));
    return NextResponse.json(resultado);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      return NextResponse.json(
        { error: "Acta no encontrada" },
        { status: 404 }
      );
    }
    throw error;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const { id } = await params;
  const json = await request.json();
  const servicio = crearServicio();
  const acta = await servicio.actualizarActa(Number(id), json, sesion);

  if (!acta) {
    return NextResponse.json(
      { error: "Acta no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(acta);
}
