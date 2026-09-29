import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and, type SQL } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import { condicionEscuelaEnAmbito } from "./ambito.condiciones";

export type FilaEscaneo = typeof esquema.escaneos.$inferSelect;

export async function listarEscaneos(
  db: LibSQLDatabase<typeof esquema>,
  filtros: { escuelaId?: number; tomo?: number },
  ambito: AmbitoConsulta
): Promise<FilaEscaneo[]> {
  const condiciones: (SQL | undefined)[] = [
    condicionEscuelaEnAmbito(ambito, esquema.escaneos.escuelaId),
  ];
  if (filtros.escuelaId) {
    condiciones.push(eq(esquema.escaneos.escuelaId, filtros.escuelaId));
  }
  if (filtros.tomo) {
    condiciones.push(eq(esquema.escaneos.numeroTomo, filtros.tomo));
  }

  return db
    .select()
    .from(esquema.escaneos)
    .where(and(...condiciones));
}

export async function obtenerEscaneoPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  ambito: AmbitoConsulta
): Promise<FilaEscaneo | undefined> {
  const resultado = await db
    .select()
    .from(esquema.escaneos)
    .where(
      and(
        eq(esquema.escaneos.id, id),
        condicionEscuelaEnAmbito(ambito, esquema.escaneos.escuelaId)
      )
    );
  return resultado[0];
}

export async function crearEscaneo(
  db: LibSQLDatabase<typeof esquema>,
  datos: {
    escuelaId: number;
    numeroTomo: number;
    numeroFolio: number;
    url: string;
    formato: string;
    uploadedBy: number;
  }
): Promise<FilaEscaneo> {
  const [escaneo] = await db
    .insert(esquema.escaneos)
    .values(datos)
    .returning()
    .all();
  return escaneo;
}

export async function eliminarEscaneo(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaEscaneo | undefined> {
  const [escaneo] = await db
    .delete(esquema.escaneos)
    .where(eq(esquema.escaneos.id, id))
    .returning()
    .all();
  return escaneo;
}
