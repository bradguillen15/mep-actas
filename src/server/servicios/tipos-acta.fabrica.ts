import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import {
  crearServicioTiposActa,
  type ServicioTiposActa,
} from "./tipos-acta.servicio";
import * as repositorio from "@/server/repositorios/tipos-acta.repositorio";

export function crearServicioTiposActaDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioTiposActa {
  return crearServicioTiposActa(
    {
      listarTiposActaActivos: () => repositorio.listarTiposActaActivos(db),
      crearTipoActa: (datos) => repositorio.crearTipoActa(db, datos),
      obtenerTipoActaPorId: (id) => repositorio.obtenerTipoActaPorId(db, id),
      desactivarTipoActa: (id) => repositorio.desactivarTipoActa(db, id),
      contarActasPorTipo: (tipoActaId) =>
        repositorio.contarActasPorTipo(db, tipoActaId),
    },
    crearAuditor(db)
  );
}
