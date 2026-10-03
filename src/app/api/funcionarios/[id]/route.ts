import { NextRequest, NextResponse } from "next/server";
import { crearServicioFuncionariosDesdeDb } from "@/server/servicios/funcionarios.fabrica";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import {
  responderErrorDeRecurso,
  respuestaNoAutorizada,
} from "@/server/http/respuestas";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const servicio = crearServicioFuncionariosDesdeDb(clienteDb());
  const funcionario = await servicio.obtenerFuncionarioPorId(
    Number(id),
    derivarAmbitoConsulta(sesion)
  );

  if (!funcionario) {
    return NextResponse.json(
      { error: "Funcionario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(funcionario);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const { id } = await params;
  const cuerpo = await request.json();
  const servicio = crearServicioFuncionariosDesdeDb(clienteDb());

  try {
    const funcionario = await servicio.actualizarFuncionario(
      Number(id),
      cuerpo,
      sesion
    );
    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionario no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(funcionario);
  } catch (e) {
    return responderErrorDeRecurso(e, "Funcionario no encontrado");
  }
}
