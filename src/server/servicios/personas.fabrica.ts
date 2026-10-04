import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import { crearServicioPersonas, type ServicioPersonas } from "./personas.servicio";
import * as repositorio from "@/server/repositorios/personas.repositorio";

export function crearServicioPersonasDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioPersonas {
  return crearServicioPersonas(
    {
      listarPersonas: (busqueda, ambito) =>
        repositorio.listarPersonas(db, busqueda, ambito),
      obtenerPersonaPorId: (id, ambito) =>
        repositorio.obtenerPersonaPorId(db, id, ambito),
      obtenerPersonaPorIdentificacion: (identificacion) =>
        repositorio.obtenerPersonaPorIdentificacion(db, identificacion),
      obtenerPersonaMinimaPorIdentificacion: (identificacion) =>
        repositorio.obtenerPersonaMinimaPorIdentificacion(db, identificacion),
      crearPersona: (datos) => repositorio.crearPersona(db, datos),
      actualizarPersona: (id, datos) =>
        repositorio.actualizarPersona(db, id, datos),
    },
    crearAuditor(db)
  );
}
