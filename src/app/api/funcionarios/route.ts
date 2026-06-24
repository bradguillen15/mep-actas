import { NextRequest, NextResponse } from "next/server";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioFuncionarios } from "@/server/servicios/funcionarios.servicio";
import * as repositorio from "@/server/repositorios/funcionarios.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

async function crearServicio() {
  const db = clienteDb();
  const auditor = crearAuditor(db);
  return crearServicioFuncionarios(
    {
      listarFuncionarios: (filtros) =>
        repositorio.listarFuncionarios(db, filtros),
      obtenerFuncionarioPorId: (id) =>
        repositorio.obtenerFuncionarioPorId(db, id),
      crearFuncionario: (datos) => repositorio.crearFuncionario(db, datos),
      actualizarFuncionario: (id, datos) =>
        repositorio.actualizarFuncionario(db, id, datos),
      asignarFuncionarioAEscuela: (funcionarioId, escuelaId) =>
        repositorio.asignarFuncionarioAEscuela(db, funcionarioId, escuelaId),
      removerFuncionarioDeEscuela: (funcionarioId, escuelaId) =>
        repositorio.removerFuncionarioDeEscuela(db, funcionarioId, escuelaId),
      listarEscuelasDeFuncionario: (funcionarioId) =>
        repositorio.listarEscuelasDeFuncionario(db, funcionarioId),
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

  const servicio = await crearServicio();
  const funcionarios = await servicio.listarFuncionarios(
    escuelaId ? { escuelaId } : undefined
  );

  return NextResponse.json(funcionarios);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const cuerpo = await request.json();
  const servicio = await crearServicio();

  try {
    const funcionario = await servicio.crearFuncionario(cuerpo, sesion);
    return NextResponse.json(funcionario, { status: 201 });
  } catch (e) {
    const mensaje =
      e instanceof Error ? e.message : "Error al crear funcionario";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
