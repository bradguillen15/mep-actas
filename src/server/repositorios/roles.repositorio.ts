import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { asc } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaRol = typeof esquema.roles.$inferSelect;

export async function listarRoles(
  db: LibSQLDatabase<typeof esquema>
): Promise<FilaRol[]> {
  return db.select().from(esquema.roles).orderBy(asc(esquema.roles.nivel));
}
