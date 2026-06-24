import { NextResponse, NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioUsuarios } from "@/server/servicios/usuarios.servicio";
import * as repositorio from "@/server/repositorios/usuarios.repositorio";
import { clienteDb } from "@/db/cliente";
import { obtenerSesion } from "@/server/auth/sesion.servicio";
import { verificarRol } from "@/server/auth/autorizacion.servicio";

const db = clienteDb();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const { id } = await params;
  const auditor = crearAuditor(db);
  const servicio = crearServicioUsuarios(
    {
      listarUsuarios: () => repositorio.listarUsuarios(db),
      obtenerUsuarioPorId: (i) => repositorio.obtenerUsuarioPorId(db, i),
      obtenerUsuarioPorEmail: (email) =>
        repositorio.obtenerUsuarioPorEmail(db, email),
      crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
      actualizarPassword: (i, pwHash) =>
        repositorio.actualizarPassword(db, i, pwHash),
      cambiarEstadoUsuario: (i, activo) =>
        repositorio.cambiarEstadoUsuario(db, i, activo),
      obtenerNivelDeRol: (rolId) => repositorio.obtenerNivelDeRol(db, rolId),
      obtenerAmbitoDeFuncionario: (funcId) =>
        repositorio.obtenerAmbitoDeFuncionario(db, funcId),
    },
    auditor
  );

  try {
    const usuario = await servicio.obtenerPorId(Number(id));
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

  const verificacion = verificarRol(sesion, 2);
  if (!verificacion.autorizado) {
    return NextResponse.json({ error: verificacion.error }, { status: 403 });
  }

  const { id } = await params;
  const json = await request.json();
  const auditor = crearAuditor(db);
  const servicio = crearServicioUsuarios(
    {
      listarUsuarios: () => repositorio.listarUsuarios(db),
      obtenerUsuarioPorId: (i) => repositorio.obtenerUsuarioPorId(db, i),
      obtenerUsuarioPorEmail: (email) =>
        repositorio.obtenerUsuarioPorEmail(db, email),
      crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
      actualizarPassword: (i, pwHash) =>
        repositorio.actualizarPassword(db, i, pwHash),
      cambiarEstadoUsuario: (i, activo) =>
        repositorio.cambiarEstadoUsuario(db, i, activo),
      obtenerNivelDeRol: (rolId) => repositorio.obtenerNivelDeRol(db, rolId),
      obtenerAmbitoDeFuncionario: (funcId) =>
        repositorio.obtenerAmbitoDeFuncionario(db, funcId),
    },
    auditor
  );

  try {
    if (json.password) {
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
