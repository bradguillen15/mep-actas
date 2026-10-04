import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import {
  crearServicioEscuelas,
  type ServicioEscuelas,
} from "./escuelas.servicio";
import * as repositorio from "@/server/repositorios/escuelas.repositorio";

export function crearServicioEscuelasDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioEscuelas {
  return crearServicioEscuelas(
    {
      listarEscuelas: (filtros) => repositorio.listarEscuelas(db, filtros),
      obtenerEscuelaPorId: (id) => repositorio.obtenerEscuelaPorId(db, id),
      obtenerEscuelaPorCodigoMep: (codigoMep) =>
        repositorio.obtenerEscuelaPorCodigoMep(db, codigoMep),
      crearEscuela: (datos) => repositorio.crearEscuela(db, datos),
      actualizarEscuela: (id, datos) =>
        repositorio.actualizarEscuela(db, id, datos),
      desactivarEscuela: (id) => repositorio.desactivarEscuela(db, id),
      contarActasActivas: (id) => repositorio.contarActasActivas(db, id),
    },
    crearAuditor(db)
  );
}
