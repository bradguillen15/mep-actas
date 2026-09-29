import { NextResponse, NextRequest } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioActas } from "@/server/servicios/actas.servicio";
import * as actasRepositorio from "@/server/repositorios/actas.repositorio";
import * as detalleRepositorio from "@/server/repositorios/actas.detalle.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { ambitoDeEscuelaObjetivo } from "@/server/auth/ambito";
import { resolverAmbitoDeEscuela } from "@/server/repositorios/escuelas.repositorio";

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

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const escuelaId = searchParams.get("escuelaId")
    ? Number(searchParams.get("escuelaId"))
    : undefined;
  const tipoActaId = searchParams.get("tipoActaId")
    ? Number(searchParams.get("tipoActaId"))
    : undefined;
  const tomo = searchParams.get("tomo")
    ? Number(searchParams.get("tomo"))
    : undefined;

  const servicio = crearServicio();
  const actas = await servicio.listarActas({
    escuelaId,
    tipoActaId,
    tomo,
  });
  return NextResponse.json(actas);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 4);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const json = await request.json();

  const db = clienteDb();
  const ambitoObjetivo = await ambitoDeEscuelaObjetivo(
    sesion,
    Number(json.escuelaId),
    (escuelaId) => resolverAmbitoDeEscuela(db, escuelaId)
  );
  const verificacionAmbito = verificarRol(sesion, 4, ambitoObjetivo);
  if (!verificacionAmbito.autorizado) {
    return NextResponse.json(
      { error: verificacionAmbito.error },
      { status: 403 }
    );
  }

  const servicio = crearServicio();
  const acta = await servicio.crearActa(json, sesion);
  return NextResponse.json(acta, { status: 201 });
}
