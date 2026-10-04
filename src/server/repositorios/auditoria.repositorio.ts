import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { ConexionDb } from "@/db/tipos";
import { eq, desc, sql, type SQL, and } from "drizzle-orm";
import { auditoria } from "@/db/esquema";
import * as esquema from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";

export interface DatosAuditoria {
  usuarioId: number;
  tabla: string;
  registroId: number;
  accion: string;
  datosAnteriores: string | null;
  datosNuevos: string | null;
  escuelaId: number | null;
  regionId: number | null;
  createdAt: string;
}

export type FiltrosAuditoria = {
  usuarioId?: number;
  tabla?: string;
  accion?: string;
  limite?: number;
};

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
  db: ConexionDb,
  datos: DatosAuditoria
): Promise<void> {
  await db.insert(auditoria).values({
    usuarioId: datos.usuarioId,
    tabla: datos.tabla,
    registroId: datos.registroId,
    accion: datos.accion,
    datosAnteriores: datos.datosAnteriores,
    datosNuevos: datos.datosNuevos,
    escuelaId: datos.escuelaId,
    regionId: datos.regionId,
    createdAt: datos.createdAt,
  });
}

function condicionAuditoriaEnAmbito(ambito: AmbitoConsulta): SQL | undefined {
  switch (ambito.tipo) {
    case "pais":
      return undefined;
    case "region":
      return eq(esquema.auditoria.regionId, ambito.regionId);
    case "escuela":
      return eq(esquema.auditoria.escuelaId, ambito.escuelaId);
    case "ninguno":
      return sql`0 = 1`;
  }
}

export async function listarAuditoria(
  db: LibSQLDatabase<typeof esquema>,
  filtros: FiltrosAuditoria,
  ambito: AmbitoConsulta
): Promise<FilaAuditoriaLista[]> {
  const condiciones: (SQL | undefined)[] = [condicionAuditoriaEnAmbito(ambito)];

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
    .where(and(...condiciones))
    .orderBy(desc(esquema.auditoria.createdAt))
    .limit(filtros.limite ?? 100);

  return query;
}
