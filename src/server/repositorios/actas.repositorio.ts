import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and, type SQL } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaActa = typeof esquema.actas.$inferSelect;

export type DatosNuevaActa = {
  escuelaId: number;
  tipoActaId: number;
  actaReferenciaId?: number;
  titulo: string;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  fecha: string;
};

export async function listarActas(
  db: LibSQLDatabase<typeof esquema>,
  filtros: { escuelaId?: number; tipoActaId?: number; tomo?: number }
): Promise<FilaActa[]> {
  const condiciones: SQL[] = [];
  if (filtros.escuelaId)
    condiciones.push(eq(esquema.actas.escuelaId, filtros.escuelaId));
  if (filtros.tipoActaId)
    condiciones.push(eq(esquema.actas.tipoActaId, filtros.tipoActaId));
  if (filtros.tomo)
    condiciones.push(eq(esquema.actas.numeroTomo, filtros.tomo));

  if (condiciones.length > 0) {
    return db
      .select()
      .from(esquema.actas)
      .where(and(...condiciones));
  }

  return db.select().from(esquema.actas);
}

export async function obtenerActaPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaActa | undefined> {
  const resultado = await db
    .select()
    .from(esquema.actas)
    .where(eq(esquema.actas.id, id));
  return resultado[0];
}

export async function crearActa(
  db: LibSQLDatabase<typeof esquema>,
  datos: DatosNuevaActa
): Promise<FilaActa> {
  const [acta] = await db
    .insert(esquema.actas)
    .values(datos)
    .returning()
    .all();
  return acta;
}

export async function actualizarActa(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  datos: Partial<DatosNuevaActa>
): Promise<FilaActa | undefined> {
  const [acta] = await db
    .update(esquema.actas)
    .set(datos)
    .where(eq(esquema.actas.id, id))
    .returning()
    .all();
  return acta;
}
