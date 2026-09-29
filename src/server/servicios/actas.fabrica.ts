import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "@/db/esquema";
import { crearAuditor } from "./auditoria.servicio";
import { crearServicioActas, type ServicioActas } from "./actas.servicio";
import * as actasRepositorio from "@/server/repositorios/actas.repositorio";
import * as detalleRepositorio from "@/server/repositorios/actas.detalle.repositorio";

export function crearServicioActasDesdeDb(
  db: LibSQLDatabase<typeof esquema>
): ServicioActas {
  return crearServicioActas(
    {
      listarActas: (filtros, ambito) =>
        actasRepositorio.listarActas(db, filtros, ambito),
      obtenerActaPorId: (id, ambito) =>
        actasRepositorio.obtenerActaPorId(db, id, ambito),
      crearActa: (datos) => actasRepositorio.crearActa(db, datos),
      actualizarActa: (id, datos) =>
        actasRepositorio.actualizarActa(db, id, datos),
    },
    {
      listarEstudiantesDeActa: (actaId) =>
        detalleRepositorio.listarEstudiantesDeActa(db, actaId),
      agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
        detalleRepositorio.agregarEstudianteAActa(
          db,
          actaId,
          personaId,
          numeroCertificado
        ),
      listarFirmantesDeActa: (actaId) =>
        detalleRepositorio.listarFirmantesDeActa(db, actaId),
      agregarFirmante: (actaId, funcionarioId, rolFirma) =>
        detalleRepositorio.agregarFirmante(db, actaId, funcionarioId, rolFirma),
    },
    crearAuditor(db)
  );
}
