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

export function datosSesionAdminPais(usuarioId: number, rolId: number) {
  return {
    usuarioId,
    email: "admin-pais@e2e.test",
    nivel: 1 as const,
    rolId,
    funcionarioId: 1,
  };
}

export function datosSesionAdminRegional(
  usuarioId: number,
  rolId: number,
  regionId: number
) {
  return {
    usuarioId,
    email: "admin-regional@e2e.test",
    nivel: 2 as const,
    rolId,
    funcionarioId: 2,
    regionId,
  };
}

export function datosSesionAdminEscuela(
  usuarioId: number,
  rolId: number,
  escuelaId: number
) {
  return {
    usuarioId,
    email: "admin-escuela@e2e.test",
    nivel: 3 as const,
    rolId,
    funcionarioId: 3,
    escuelaId,
  };
}

export function datosSesionStaff(
  usuarioId: number,
  rolId: number,
  escuelaId: number
) {
  return {
    usuarioId,
    email: "staff@e2e.test",
    nivel: 4 as const,
    rolId,
    funcionarioId: 4,
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
