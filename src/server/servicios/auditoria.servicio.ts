import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as esquema from "@/db/esquema";
import {
  insertarRegistroAuditoria,
  type DatosAuditoria,
} from "../repositorios/auditoria.repositorio";

export type Auditor = (params: Omit<DatosAuditoria, "createdAt">) => Promise<void>;

export function crearAuditor(
  db: LibSQLDatabase<typeof esquema>
): Auditor {
  return async (params) => {
    await insertarRegistroAuditoria(db, {
      ...params,
      createdAt: new Date().toISOString(),
    });
  };
}
