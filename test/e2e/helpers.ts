import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
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
