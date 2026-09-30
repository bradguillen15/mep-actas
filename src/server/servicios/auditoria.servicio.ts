import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as esquema from "@/db/esquema";
import {
  insertarRegistroAuditoria,
  type DatosAuditoria,
} from "../repositorios/auditoria.repositorio";
import { resolverAmbitoDeEscuela } from "../repositorios/escuelas.repositorio";

export type ParametrosAuditoria = Omit<
  DatosAuditoria,
  "createdAt" | "escuelaId" | "regionId"
> & {
  escuelaId?: number | null;
  regionId?: number | null;
};

export type Auditor = (params: ParametrosAuditoria) => Promise<void>;

export function crearAuditor(
  db: LibSQLDatabase<typeof esquema>
): Auditor {
  return async ({ escuelaId = null, regionId = null, ...params }) => {
    const regionResuelta =
      regionId ??
      (escuelaId !== null
        ? ((await resolverAmbitoDeEscuela(db, escuelaId))?.regionId ?? null)
        : null);

    await insertarRegistroAuditoria(db, {
      ...params,
      escuelaId,
      regionId: regionResuelta,
      createdAt: new Date().toISOString(),
    });
  };
}
