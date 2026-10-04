import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import * as repositorioGraduaciones from "@/server/repositorios/graduaciones.repositorio";
import {
  crearServicioGraduaciones,
  type ServicioGraduaciones,
} from "./graduaciones.servicio";

export function crearServicioGraduacionesDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioGraduaciones {
  return crearServicioGraduaciones({
    buscarGraduaciones: (params, ambito) =>
      repositorioGraduaciones.buscarGraduaciones(db, params, ambito),
    obtenerGraduacionPorId: (id, ambito) =>
      repositorioGraduaciones.obtenerGraduacionPorId(db, id, ambito),
  });
}
