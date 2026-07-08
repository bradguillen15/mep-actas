import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and, or, desc, gte, lte, sql, count, type SQL } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import { LIMITE_GRADUACIONES_POR_PAGINA } from "@/lib/graduaciones";

export type ResultadoGraduacion = {
  actaEstudianteId: number;
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

export type ParametrosBusquedaGraduaciones = {
  identificacion?: string;
  nombre?: string;
  escuelaId?: number;
  tipoActaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  numeroCertificado?: string;
  tituloActa?: string;
  pagina?: number;
  limite?: number;
};

export type ResultadoBusquedaGraduaciones = {
  datos: ResultadoGraduacion[];
  total: number;
  pagina: number;
  limite: number;
};

const COLUMNAS = {
  actaEstudianteId: esquema.actaEstudiantes.id,
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

function patronLike(term: string): string {
  return `%${term.trim().toLowerCase()}%`;
}

function construirCondiciones(params: ParametrosBusquedaGraduaciones): SQL[] {
  const condiciones: SQL[] = [];

  if (params.identificacion) {
    const patron = patronLike(params.identificacion);
    condiciones.push(
      sql`lower(${esquema.personas.identificacion}) like ${patron}`
    );
  }

  if (params.nombre) {
    const patron = patronLike(params.nombre);
    condiciones.push(
      or(
        sql`lower(${esquema.personas.nombres}) like ${patron}`,
        sql`lower(${esquema.personas.apellidos}) like ${patron}`,
        sql`lower(${esquema.personas.nombres} || ' ' || ${esquema.personas.apellidos}) like ${patron}`
      )!
    );
  }

  if (params.escuelaId) {
    condiciones.push(eq(esquema.actas.escuelaId, params.escuelaId));
  }

  if (params.tipoActaId) {
    condiciones.push(eq(esquema.actas.tipoActaId, params.tipoActaId));
  }

  if (params.fechaDesde) {
    condiciones.push(gte(esquema.actas.fecha, params.fechaDesde));
  }

  if (params.fechaHasta) {
    condiciones.push(lte(esquema.actas.fecha, params.fechaHasta));
  }

  if (params.numeroCertificado) {
    const patron = `%${params.numeroCertificado.trim()}%`;
    condiciones.push(
      sql`cast(${esquema.actaEstudiantes.numeroCertificado} as text) like ${patron}`
    );
  }

  if (params.tituloActa) {
    const patron = patronLike(params.tituloActa);
    condiciones.push(sql`lower(${esquema.actas.titulo}) like ${patron}`);
  }

  return condiciones;
}

export async function buscarGraduaciones(
  db: LibSQLDatabase<typeof esquema>,
  params: ParametrosBusquedaGraduaciones
): Promise<ResultadoBusquedaGraduaciones> {
  const condiciones = construirCondiciones(params);
  const limite = params.limite ?? LIMITE_GRADUACIONES_POR_PAGINA;
  const pagina = Math.max(1, params.pagina ?? 1);
  const offset = (pagina - 1) * limite;
  const filtro = condiciones.length > 0 ? and(...condiciones) : undefined;

  const conteoQuery = db
    .select({ conteo: count() })
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

  const [{ conteo: total }] = filtro
    ? await conteoQuery.where(filtro)
    : await conteoQuery;

  const datosQuery = db
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
    .orderBy(desc(esquema.actas.fecha))
    .limit(limite)
    .offset(offset);

  const datos = filtro ? await datosQuery.where(filtro) : await datosQuery;

  return { datos, total, pagina, limite };
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
