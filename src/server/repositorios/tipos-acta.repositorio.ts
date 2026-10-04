import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, count } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import { actas, tiposActas } from "@/db/esquema";

export type FilaTipoActa = typeof tiposActas.$inferSelect;

export async function listarTiposActaActivos(
  db: LibSQLDatabase<typeof esquema>
): Promise<Pick<FilaTipoActa, "id" | "nombre">[]> {
  return db
    .select({ id: tiposActas.id, nombre: tiposActas.nombre })
    .from(tiposActas)
    .where(eq(tiposActas.activo, true))
    .all();
}

export async function crearTipoActa(
  db: LibSQLDatabase<typeof esquema>,
  datos: { nombre: string }
): Promise<FilaTipoActa> {
  const [tipo] = await db
    .insert(tiposActas)
    .values({ nombre: datos.nombre })
    .returning()
    .all();

  return tipo;
}

export async function obtenerTipoActaPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaTipoActa | undefined> {
  const [tipo] = await db
    .select()
    .from(tiposActas)
    .where(eq(tiposActas.id, id))
    .all();

  return tipo;
}

export async function desactivarTipoActa(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaTipoActa | undefined> {
  const [tipo] = await db
    .update(tiposActas)
    .set({ activo: false })
    .where(eq(tiposActas.id, id))
    .returning()
    .all();

  return tipo;
}

export async function contarActasPorTipo(
  db: LibSQLDatabase<typeof esquema>,
  tipoActaId: number
): Promise<number> {
  const [resultado] = await db
    .select({ conteo: count() })
    .from(actas)
    .where(eq(actas.tipoActaId, tipoActaId))
    .all();

  return resultado?.conteo ?? 0;
}
