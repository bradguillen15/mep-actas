import { NextRequest, NextResponse } from "next/server";
import { crearServicioFuncionariosDesdeDb } from "@/server/servicios/funcionarios.fabrica";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { respuestaNoAutorizada } from "@/server/http/respuestas";

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const escuelaId = searchParams.get("escuelaId")
    ? Number(searchParams.get("escuelaId"))
    : undefined;

  const servicio = crearServicioFuncionariosDesdeDb(clienteDb());
  const funcionarios = await servicio.listarFuncionarios(
    escuelaId ? { escuelaId } : undefined,
    derivarAmbitoConsulta(sesion)
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
    return respuestaNoAutorizada(verificacion);
  }

  const cuerpo = await request.json();
  const servicio = crearServicioFuncionariosDesdeDb(clienteDb());

  try {
    const funcionario = await servicio.crearFuncionario(cuerpo, sesion);
    return NextResponse.json(funcionario, { status: 201 });
  } catch (e) {
    const mensaje =
      e instanceof Error ? e.message : "Error al crear funcionario";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
