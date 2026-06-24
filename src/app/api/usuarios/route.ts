import { NextResponse, NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioUsuarios } from "@/server/servicios/usuarios.servicio";
import * as repositorio from "@/server/repositorios/usuarios.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

const db = clienteDb();

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const auditor = crearAuditor(db);
  const servicio = crearServicioUsuarios(
    {
      listarUsuarios: () => repositorio.listarUsuarios(db),
      obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
      obtenerUsuarioPorEmail: (email) =>
        repositorio.obtenerUsuarioPorEmail(db, email),
      crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
      actualizarPassword: (id, passwordHash) =>
        repositorio.actualizarPassword(db, id, passwordHash),
      cambiarEstadoUsuario: (id, activo) =>
        repositorio.cambiarEstadoUsuario(db, id, activo),
    },
    auditor
  );

  const usuarios = await servicio.listar();
  return NextResponse.json(usuarios);
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

  const json = await request.json();
  const passwordHash = hashSync(json.password, 10);

  const auditor = crearAuditor(db);
  const servicio = crearServicioUsuarios(
    {
      listarUsuarios: () => repositorio.listarUsuarios(db),
      obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
      obtenerUsuarioPorEmail: (email) =>
        repositorio.obtenerUsuarioPorEmail(db, email),
      crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
      actualizarPassword: (id, pwHash) =>
        repositorio.actualizarPassword(db, id, pwHash),
      cambiarEstadoUsuario: (id, activo) =>
        repositorio.cambiarEstadoUsuario(db, id, activo),
    },
    auditor
  );

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
    throw error;
  }
}
