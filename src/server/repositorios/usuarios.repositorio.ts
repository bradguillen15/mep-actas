import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaUsuarioConRol = Pick<
  typeof esquema.usuarios.$inferSelect,
  "id" | "email" | "passwordHash" | "funcionarioId" | "rolId"
> & {
  nivel: number;
};

export async function obtenerUsuarioPorEmail(
  db: LibSQLDatabase<typeof esquema>,
  email: string
): Promise<FilaUsuarioConRol | undefined> {
  const resultado = await db
    .select({
      id: esquema.usuarios.id,
      email: esquema.usuarios.email,
      passwordHash: esquema.usuarios.passwordHash,
      funcionarioId: esquema.usuarios.funcionarioId,
      rolId: esquema.usuarios.rolId,
      nivel: esquema.roles.nivel,
    })
    .from(esquema.usuarios)
    .innerJoin(esquema.roles, eq(esquema.usuarios.rolId, esquema.roles.id))
    .where(eq(esquema.usuarios.email, email));

  return resultado[0];
}
