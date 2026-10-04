import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, sql, count } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import { regiones, escuelas } from "@/db/esquema";

export type FilaRegion = typeof regiones.$inferSelect;
export type DatosNuevaRegion = typeof regiones.$inferInsert;

export async function listarRegiones(
  db: LibSQLDatabase<typeof esquema>
): Promise<FilaRegion[]> {
  const resultado = await db
    .select()
    .from(regiones)
    .where(eq(regiones.activo, true))
    .all();
  return resultado as FilaRegion[];
}

export async function obtenerRegionPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaRegion | undefined> {
  const resultado = await db
    .select()
    .from(regiones)
    .where(eq(regiones.id, id))
    .all() as unknown as FilaRegion[];

  return resultado[0];
}

export async function crearRegion(
  db: LibSQLDatabase<typeof esquema>,
  datos: Pick<DatosNuevaRegion, "nombre">
): Promise<FilaRegion> {
  const [region] = await db
    .insert(regiones)
    .values({ nombre: datos.nombre })
    .returning();

  return region as FilaRegion;
}

export async function actualizarRegion(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  datos: Partial<Pick<DatosNuevaRegion, "nombre">>
): Promise<FilaRegion | undefined> {
  const [region] = await db
    .update(regiones)
    .set({ nombre: datos.nombre })
    .where(eq(regiones.id, id))
    .returning();

  return region as FilaRegion | undefined;
}

export async function desactivarRegion(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaRegion | undefined> {
  const [region] = await db
    .update(regiones)
    .set({ activo: false })
    .where(eq(regiones.id, id))
    .returning();

  return region as FilaRegion | undefined;
}

export async function contarEscuelasActivas(
  db: LibSQLDatabase<typeof esquema>,
  regionId: number
): Promise<number> {
  const resultado = await db
    .select({ conteo: count() })
    .from(escuelas)
    .where(
      sql`${escuelas.regionId} = ${regionId} AND ${escuelas.activo} = ${true}`
    )
    .all();
  const fila = (resultado as { conteo: number }[])[0];

  return fila?.conteo ?? 0;
}
