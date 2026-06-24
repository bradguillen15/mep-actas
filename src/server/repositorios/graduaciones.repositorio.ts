import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and, like, or, type SQL } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type ResultadoGraduacion = {
  actaId: number;
  titulo: string;
  fecha: string;
  numeroTomo: number;
  folioInicio: number;
  folioFin: number;
  tipoActaNombre: string;
  escuelaId: number;
  escuelaNombre: string;
  estudianteId: number;
  personaId: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCertificado: number;
};

const COLUMNAS = {
  actaId: esquema.actas.id,
  titulo: esquema.actas.titulo,
  fecha: esquema.actas.fecha,
  numeroTomo: esquema.actas.numeroTomo,
  folioInicio: esquema.actas.folioInicio,
  folioFin: esquema.actas.folioFin,
  tipoActaNombre: esquema.tiposActas.nombre,
  escuelaId: esquema.escuelas.id,
  escuelaNombre: esquema.escuelas.nombre,
  estudianteId: esquema.estudiantes.id,
  personaId: esquema.personas.id,
  identificacion: esquema.personas.identificacion,
  nombres: esquema.personas.nombres,
  apellidos: esquema.personas.apellidos,
  numeroCertificado: esquema.actaEstudiantes.numeroCertificado,
};

export async function buscarGraduaciones(
  db: LibSQLDatabase<typeof esquema>,
  params: { identificacion?: string; nombre?: string; escuelaId?: number }
): Promise<ResultadoGraduacion[]> {
  const condiciones: SQL[] = [];

  if (params.identificacion) {
    condiciones.push(
      eq(esquema.personas.identificacion, params.identificacion)
    );
  }

  if (params.nombre) {
    condiciones.push(
      or(
        like(esquema.personas.nombres, `%${params.nombre}%`),
        like(esquema.personas.apellidos, `%${params.nombre}%`)
      )!
    );
  }

  if (params.escuelaId) {
    condiciones.push(eq(esquema.actas.escuelaId, params.escuelaId));
  }

  const query = db
    .select(COLUMNAS)
    .from(esquema.actas)
    .innerJoin(
      esquema.tiposActas,
      eq(esquema.actas.tipoActaId, esquema.tiposActas.id)
    )
    .innerJoin(
      esquema.escuelas,
      eq(esquema.actas.escuelaId, esquema.escuelas.id)
    )
    .innerJoin(
      esquema.actaEstudiantes,
      eq(esquema.actas.id, esquema.actaEstudiantes.actaId)
    )
    .innerJoin(
      esquema.estudiantes,
      eq(esquema.actaEstudiantes.estudianteId, esquema.estudiantes.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.estudiantes.personaId, esquema.personas.id)
    );

  if (condiciones.length > 0) {
    return query.where(and(...condiciones));
  }

  return query;
}

export async function obtenerGraduacionPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<ResultadoGraduacion[]> {
  return db
    .select(COLUMNAS)
    .from(esquema.actas)
    .innerJoin(
      esquema.tiposActas,
      eq(esquema.actas.tipoActaId, esquema.tiposActas.id)
    )
    .innerJoin(
      esquema.escuelas,
      eq(esquema.actas.escuelaId, esquema.escuelas.id)
    )
    .innerJoin(
      esquema.actaEstudiantes,
      eq(esquema.actas.id, esquema.actaEstudiantes.actaId)
    )
    .innerJoin(
      esquema.estudiantes,
      eq(esquema.actaEstudiantes.estudianteId, esquema.estudiantes.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.estudiantes.personaId, esquema.personas.id)
    )
    .where(eq(esquema.actas.id, id));
}
