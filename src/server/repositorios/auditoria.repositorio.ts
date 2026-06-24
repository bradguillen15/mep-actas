import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, desc, type SQL, and } from "drizzle-orm";
import { auditoria } from "@/db/esquema";
import * as esquema from "@/db/esquema";

export interface DatosAuditoria {
  usuarioId: number;
  tabla: string;
  registroId: number;
  accion: string;
  datosAnteriores: string | null;
  datosNuevos: string | null;
  createdAt: string;
}

export type FilaAuditoriaLista = {
  id: number;
  usuarioId: number;
  usuarioEmail: string;
  tabla: string;
  registroId: number;
  accion: string;
  datosAnteriores: string | null;
  datosNuevos: string | null;
  createdAt: string;
};

export async function insertarRegistroAuditoria(
  db: LibSQLDatabase<typeof esquema>,
  datos: DatosAuditoria
): Promise<void> {
  await db.insert(auditoria).values({
    usuarioId: datos.usuarioId,
    tabla: datos.tabla,
    registroId: datos.registroId,
    accion: datos.accion,
    datosAnteriores: datos.datosAnteriores,
    datosNuevos: datos.datosNuevos,
    createdAt: datos.createdAt,
  });
}

export async function listarAuditoria(
  db: LibSQLDatabase<typeof esquema>,
  filtros: {
    usuarioId?: number;
    tabla?: string;
    accion?: string;
    limite?: number;
  }
): Promise<FilaAuditoriaLista[]> {
  const condiciones: SQL[] = [];

  if (filtros.usuarioId)
    condiciones.push(eq(esquema.auditoria.usuarioId, filtros.usuarioId));
  if (filtros.tabla)
    condiciones.push(eq(esquema.auditoria.tabla, filtros.tabla));
  if (filtros.accion)
    condiciones.push(eq(esquema.auditoria.accion, filtros.accion));

  const query = db
    .select({
      id: esquema.auditoria.id,
      usuarioId: esquema.auditoria.usuarioId,
      usuarioEmail: esquema.usuarios.email,
      tabla: esquema.auditoria.tabla,
      registroId: esquema.auditoria.registroId,
      accion: esquema.auditoria.accion,
      datosAnteriores: esquema.auditoria.datosAnteriores,
      datosNuevos: esquema.auditoria.datosNuevos,
      createdAt: esquema.auditoria.createdAt,
    })
    .from(esquema.auditoria)
    .innerJoin(
      esquema.usuarios,
      eq(esquema.auditoria.usuarioId, esquema.usuarios.id)
    )
    .orderBy(desc(esquema.auditoria.createdAt))
    .limit(filtros.limite ?? 100);

  if (condiciones.length > 0) {
    return query.where(and(...condiciones));
  }

  return query;
}
