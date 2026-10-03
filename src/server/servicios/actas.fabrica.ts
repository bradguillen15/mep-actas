import type { BaseDeDatos, ConexionDb } from "@/db/tipos";
import { crearAuditor } from "./auditoria.servicio";
import {
  crearServicioActas,
  type EjecutarEnTransaccion,
  type OperacionesTransaccionales,
  type ServicioActas,
} from "./actas.servicio";
import * as actasRepositorio from "@/server/repositorios/actas.repositorio";
import * as personasRepositorio from "@/server/repositorios/personas.repositorio";
import * as detalleRepositorio from "@/server/repositorios/actas.detalle.repositorio";

function operacionesSobre(conexion: ConexionDb): OperacionesTransaccionales {
  return {
    obtenerActaPorId: (id, ambito) =>
      actasRepositorio.obtenerActaPorId(conexion, id, ambito),
    crearActa: (datos) => actasRepositorio.crearActa(conexion, datos),
    listarEstudiantesDeActa: (actaId) =>
      detalleRepositorio.listarEstudiantesDeActa(conexion, actaId),
    agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
      detalleRepositorio.agregarEstudianteAActa(
        conexion,
        actaId,
        personaId,
        numeroCertificado
      ),
    obtenerPersonaPorIdentificacion: (identificacion) =>
      personasRepositorio.obtenerPersonaPorIdentificacion(
        conexion,
        identificacion
      ),
    crearPersona: (datos) => personasRepositorio.crearPersona(conexion, datos),
    auditor: crearAuditor(conexion),
  };
}

export function crearServicioActasDesdeDb(db: BaseDeDatos): ServicioActas {
  const ejecutarEnTransaccion: EjecutarEnTransaccion = (trabajo) =>
    db.transaction((tx) => trabajo(operacionesSobre(tx)));

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
    crearAuditor(db),
    ejecutarEnTransaccion
  );
}
