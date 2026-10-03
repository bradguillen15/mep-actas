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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 3);
  if (!verificacion.autorizado) {
    return respuestaNoAutorizada(verificacion);
  }

  const { id } = await params;
  const servicio = crearServicioUsuariosDesdeDb(db);

  try {
    const usuario = await servicio.obtenerPorId(
      Number(id),
      derivarAmbitoConsulta(sesion)
    );
    return NextResponse.json(usuario);
  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
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
    return respuestaNoAutorizada(verificacion);
  }

  const { id } = await params;
  const json = await request.json();
  const servicio = crearServicioUsuariosDesdeDb(db);

  try {
    if (json.password) {
      const errorPassword = validarPassword(json.password);
      if (errorPassword) {
        return NextResponse.json({ error: errorPassword }, { status: 400 });
      }
      const passwordHash = hashSync(json.password, 10);
      await servicio.actualizarPassword(Number(id), passwordHash, sesion);
      return NextResponse.json({ ok: true });
    }
    if (json.activo !== undefined) {
      const resultado = await servicio.cambiarEstado(
        Number(id),
        json.activo,
        sesion
      );
      return NextResponse.json(resultado);
    }
    return NextResponse.json({ error: "Sin campos para actualizar" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.name === "NotFoundError") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    throw error;
  }
}
