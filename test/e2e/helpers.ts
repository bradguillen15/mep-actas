import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, inArray, or } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export async function obtenerRolPorNivel(
  db: LibSQLDatabase<typeof esquema>,
  nivel: number
) {
  const resultado: (typeof esquema.roles.$inferSelect)[] = await db
    .select()
    .from(esquema.roles)
    .where(eq(esquema.roles.nivel, nivel));

  return resultado[0];
}

export async function obtenerUsuarioPorEmail(
  db: LibSQLDatabase<typeof esquema>,
  email: string
) {
  const resultado: (typeof esquema.usuarios.$inferSelect)[] = await db
    .select()
    .from(esquema.usuarios)
    .where(eq(esquema.usuarios.email, email));

  return resultado[0];
}

export const EMAIL_ADMIN_PAIS = "admin@pais.local";
export const EMAIL_ADMIN_REGIONAL = "admin@regional.local";
export const EMAIL_ADMIN_ESCUELA = "admin@escuela.local";
export const EMAIL_STAFF = "staff@local";

type UsuarioSesion = { id: number; funcionarioId: number };

export function datosSesionAdminPais(usuario: UsuarioSesion, rolId: number) {
  return {
    usuarioId: usuario.id,
    email: EMAIL_ADMIN_PAIS,
    nivel: 1 as const,
    rolId,
    funcionarioId: usuario.funcionarioId,
  };
}

export function datosSesionAdminRegional(
  usuario: UsuarioSesion,
  rolId: number,
  regionId: number
) {
  return {
    usuarioId: usuario.id,
    email: EMAIL_ADMIN_REGIONAL,
    nivel: 2 as const,
    rolId,
    funcionarioId: usuario.funcionarioId,
    regionId,
  };
}

export function datosSesionAdminEscuela(
  usuario: UsuarioSesion,
  rolId: number,
  escuelaId: number
) {
  return {
    usuarioId: usuario.id,
    email: EMAIL_ADMIN_ESCUELA,
    nivel: 3 as const,
    rolId,
    funcionarioId: usuario.funcionarioId,
    escuelaId,
  };
}

export function datosSesionStaff(
  usuario: UsuarioSesion,
  rolId: number,
  escuelaId: number
) {
  return {
    usuarioId: usuario.id,
    email: EMAIL_STAFF,
    nivel: 4 as const,
    rolId,
    funcionarioId: usuario.funcionarioId,
    escuelaId,
  };
}

// La auditoría referencia escuelas y regiones; solo en pruebas se borran sus filas antes de limpiar esos datos.
export async function limpiarAuditoriaDeAmbito(
  db: LibSQLDatabase<typeof esquema>,
  escuelaIds: number[],
  regionIds: number[]
) {
  if (escuelaIds.length === 0 && regionIds.length === 0) return;
  await db
    .delete(esquema.auditoria)
    .where(
      or(
        escuelaIds.length > 0
          ? inArray(esquema.auditoria.escuelaId, escuelaIds)
          : undefined,
        regionIds.length > 0
          ? inArray(esquema.auditoria.regionId, regionIds)
          : undefined
      )
    );
}
