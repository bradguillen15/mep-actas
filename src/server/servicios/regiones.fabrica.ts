import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import {
  crearServicioRegiones,
  type ServicioRegiones,
} from "./regiones.servicio";
import * as repositorio from "@/server/repositorios/regiones.repositorio";

export function crearServicioRegionesDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioRegiones {
  return crearServicioRegiones(
    {
      listarRegiones: () => repositorio.listarRegiones(db),
      obtenerRegionPorId: (id) => repositorio.obtenerRegionPorId(db, id),
      crearRegion: (datos) => repositorio.crearRegion(db, datos),
      actualizarRegion: (id, datos) =>
        repositorio.actualizarRegion(db, id, datos),
      desactivarRegion: (id) => repositorio.desactivarRegion(db, id),
      contarEscuelasActivas: (regionId) =>
        repositorio.contarEscuelasActivas(db, regionId),
    },
    crearAuditor(db)
  );
}
