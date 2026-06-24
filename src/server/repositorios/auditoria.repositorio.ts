import type { LibSQLDatabase } from "drizzle-orm/libsql";
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
