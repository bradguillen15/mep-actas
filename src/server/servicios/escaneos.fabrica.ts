import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import { crearServicioEscaneos, type ServicioEscaneos } from "./escaneos.servicio";
import { crearAlmacenamientoEscaneos } from "@/server/almacenamiento/seleccion";
import * as repositorio from "@/server/repositorios/escaneos.repositorio";

export function crearServicioEscaneosDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioEscaneos {
  return crearServicioEscaneos(
    {
      listarEscaneos: (filtros, ambito) =>
        repositorio.listarEscaneos(db, filtros, ambito),
      obtenerEscaneoPorId: (id, ambito) =>
        repositorio.obtenerEscaneoPorId(db, id, ambito),
      obtenerEscaneoPorEscuelaTomoFolio: (escuelaId, numeroTomo, numeroFolio) =>
        repositorio.obtenerEscaneoPorEscuelaTomoFolio(
          db,
          escuelaId,
          numeroTomo,
          numeroFolio
        ),
      crearEscaneo: (datos) => repositorio.crearEscaneo(db, datos),
      eliminarEscaneo: (id) => repositorio.eliminarEscaneo(db, id),
    },
    crearAuditor(db),
    crearAlmacenamientoEscaneos()
  );
}
