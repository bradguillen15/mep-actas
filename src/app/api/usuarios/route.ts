import { NextResponse, NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { crearServicioUsuariosDesdeDb } from "@/server/servicios/usuarios.fabrica";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";
import { respuestaNoAutorizada } from "@/server/http/respuestas";
import { validarPassword } from "@/server/auth/politica-password";

const db = clienteDb();

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const servicio = crearServicioUsuariosDesdeDb(db);

  const usuarios = await servicio.listar(derivarAmbitoConsulta(sesion));
  return NextResponse.json(usuarios);
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const json = await request.json();

  const errorPassword = validarPassword(json.password ?? "");
  if (errorPassword) {
    return NextResponse.json({ error: errorPassword }, { status: 400 });
  }

  const passwordHash = hashSync(json.password, 10);

  const servicio = crearServicioUsuariosDesdeDb(db);

  try {
    const usuario = await servicio.crear(
      {
        funcionarioId: json.funcionarioId,
        rolId: json.rolId,
        email: json.email,
        passwordHash,
      },
      sesion
    );
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ConflictError") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.name === "NotFoundError") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
