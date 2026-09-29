import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and, type SQL } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import { condicionEscuelaEnAmbito } from "./ambito.condiciones";

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
  filtros: { escuelaId?: number; tipoActaId?: number; tomo?: number },
  ambito: AmbitoConsulta
): Promise<FilaActa[]> {
  const condiciones: (SQL | undefined)[] = [
    condicionEscuelaEnAmbito(ambito, esquema.actas.escuelaId),
  ];
  if (filtros.escuelaId)
    condiciones.push(eq(esquema.actas.escuelaId, filtros.escuelaId));
  if (filtros.tipoActaId)
    condiciones.push(eq(esquema.actas.tipoActaId, filtros.tipoActaId));
  if (filtros.tomo)
    condiciones.push(eq(esquema.actas.numeroTomo, filtros.tomo));

  return db
    .select()
    .from(esquema.actas)
    .where(and(...condiciones));
}

export async function obtenerActaPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  ambito: AmbitoConsulta
): Promise<FilaActa | undefined> {
  const resultado = await db
    .select()
    .from(esquema.actas)
    .where(
      and(
        eq(esquema.actas.id, id),
        condicionEscuelaEnAmbito(ambito, esquema.actas.escuelaId)
      )
    );
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
