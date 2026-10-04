import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { ConexionDb } from "@/db/tipos";
import { eq, and, count } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import { escuelas, actas } from "@/db/esquema";

export type FilaEscuela = typeof escuelas.$inferSelect;
export type DatosNuevaEscuela = typeof escuelas.$inferInsert;

export interface FiltrosEscuelas {
  regionId?: number;
}

export async function listarEscuelas(
  db: LibSQLDatabase<typeof esquema>,
  filtros?: FiltrosEscuelas
): Promise<FilaEscuela[]> {
  const condiciones = [eq(escuelas.activo, true)];

  if (filtros?.regionId !== undefined) {
    condiciones.push(eq(escuelas.regionId, filtros.regionId));
  }

  const resultado = await db
    .select()
    .from(escuelas)
    .where(and(...condiciones))
    .all();
  return resultado as FilaEscuela[];
}

export async function obtenerEscuelaPorId(
  db: ConexionDb,
  id: number
): Promise<FilaEscuela | undefined> {
  const resultado = await db
    .select()
    .from(escuelas)
    .where(eq(escuelas.id, id))
    .all() as unknown as FilaEscuela[];

  return resultado[0];
}

export async function obtenerEscuelaPorCodigoMep(
  db: ConexionDb,
  codigoMep: string
): Promise<FilaEscuela | undefined> {
  const resultado = (await db
    .select()
    .from(escuelas)
    .where(eq(escuelas.codigoMep, codigoMep))
    .all()) as unknown as FilaEscuela[];

  return resultado[0];
}

export type AmbitoDeEscuela = { escuelaId: number; regionId: number };

export async function resolverAmbitoDeEscuela(
  db: ConexionDb,
  escuelaId: number
): Promise<AmbitoDeEscuela | undefined> {
  const escuela = await obtenerEscuelaPorId(db, escuelaId);
  return escuela ? { escuelaId: escuela.id, regionId: escuela.regionId } : undefined;
}

export async function crearEscuela(
  db: LibSQLDatabase<typeof esquema>,
  datos: Pick<DatosNuevaEscuela, "regionId" | "codigoMep" | "nombre">
): Promise<FilaEscuela> {
  const [escuela] = await db
    .insert(escuelas)
    .values({
      regionId: datos.regionId,
      codigoMep: datos.codigoMep,
      nombre: datos.nombre,
    })
    .returning();

  return escuela as FilaEscuela;
}

export async function actualizarEscuela(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  datos: Partial<Pick<DatosNuevaEscuela, "nombre" | "codigoMep">>
): Promise<FilaEscuela | undefined> {
  const [escuela] = await db
    .update(escuelas)
    .set({
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.codigoMep !== undefined && { codigoMep: datos.codigoMep }),
    })
    .where(eq(escuelas.id, id))
    .returning();

  return escuela as FilaEscuela | undefined;
}

export async function desactivarEscuela(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaEscuela | undefined> {
  const [escuela] = await db
    .update(escuelas)
    .set({ activo: false })
    .where(eq(escuelas.id, id))
    .returning();

  return escuela as FilaEscuela | undefined;
}

export async function contarActasActivas(
  db: LibSQLDatabase<typeof esquema>,
  escuelaId: number
): Promise<number> {
  const resultado = await db
    .select({ conteo: count() })
    .from(actas)
    .where(eq(actas.escuelaId, escuelaId))
    .all();
  const fila = (resultado as { conteo: number }[])[0];

  return fila?.conteo ?? 0;
}
