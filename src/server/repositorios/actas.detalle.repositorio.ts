import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaEstudiante = typeof esquema.estudiantes.$inferSelect;
export type FilaActaEstudiante = typeof esquema.actaEstudiantes.$inferSelect;
export type FilaActaFirmante = typeof esquema.actaFirmantes.$inferSelect;

export async function listarEstudiantesDeActa(
  db: LibSQLDatabase<typeof esquema>,
  actaId: number
): Promise<(FilaActaEstudiante & { identificacion: string; nombres: string; apellidos: string })[]> {
  return db
    .select({
      id: esquema.actaEstudiantes.id,
      actaId: esquema.actaEstudiantes.actaId,
      estudianteId: esquema.actaEstudiantes.estudianteId,
      numeroCertificado: esquema.actaEstudiantes.numeroCertificado,
      identificacion: esquema.personas.identificacion,
      nombres: esquema.personas.nombres,
      apellidos: esquema.personas.apellidos,
    })
    .from(esquema.actaEstudiantes)
    .innerJoin(
      esquema.estudiantes,
      eq(esquema.actaEstudiantes.estudianteId, esquema.estudiantes.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.estudiantes.personaId, esquema.personas.id)
    )
    .where(eq(esquema.actaEstudiantes.actaId, actaId));
}

export async function agregarEstudianteAActa(
  db: LibSQLDatabase<typeof esquema>,
  actaId: number,
  personaId: number,
  numeroCertificado: number
): Promise<FilaActaEstudiante> {
  let [estudiante] = await db
    .select()
    .from(esquema.estudiantes)
    .where(eq(esquema.estudiantes.personaId, personaId));

  if (!estudiante) {
    [estudiante] = await db
      .insert(esquema.estudiantes)
      .values({ personaId })
      .returning()
      .all();
  }

  const [actaEstudiante] = await db
    .insert(esquema.actaEstudiantes)
    .values({ actaId, estudianteId: estudiante.id, numeroCertificado })
    .returning()
    .all();

  return actaEstudiante;
}

export async function listarFirmantesDeActa(
  db: LibSQLDatabase<typeof esquema>,
  actaId: number
): Promise<
  (FilaActaFirmante & { nombres: string; apellidos: string; puesto: string })[]
> {
  return db
    .select({
      id: esquema.actaFirmantes.id,
      actaId: esquema.actaFirmantes.actaId,
      funcionarioId: esquema.actaFirmantes.funcionarioId,
      rolFirma: esquema.actaFirmantes.rolFirma,
      nombres: esquema.personas.nombres,
      apellidos: esquema.personas.apellidos,
      puesto: esquema.funcionarios.puesto,
    })
    .from(esquema.actaFirmantes)
    .innerJoin(
      esquema.funcionarios,
      eq(esquema.actaFirmantes.funcionarioId, esquema.funcionarios.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.funcionarios.personaId, esquema.personas.id)
    )
    .where(eq(esquema.actaFirmantes.actaId, actaId));
}

export async function agregarFirmante(
  db: LibSQLDatabase<typeof esquema>,
  actaId: number,
  funcionarioId: number,
  rolFirma: string
): Promise<FilaActaFirmante> {
  const [firmante] = await db
    .insert(esquema.actaFirmantes)
    .values({ actaId, funcionarioId, rolFirma })
    .returning()
    .all();
  return firmante;
}
