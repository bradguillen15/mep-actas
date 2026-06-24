import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, and } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaFuncionarioConPersona = {
  id: number;
  personaId: number;
  puesto: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
};

export type FilaAsignacionEscuela = typeof esquema.funcionarioEscuela.$inferSelect;

const seleccionFuncionario = {
  id: esquema.funcionarios.id,
  personaId: esquema.funcionarios.personaId,
  puesto: esquema.funcionarios.puesto,
  identificacion: esquema.personas.identificacion,
  nombres: esquema.personas.nombres,
  apellidos: esquema.personas.apellidos,
};

export async function listarFuncionarios(
  db: LibSQLDatabase<typeof esquema>,
  filtros?: { escuelaId?: number }
): Promise<FilaFuncionarioConPersona[]> {
  const base = db
    .select(seleccionFuncionario)
    .from(esquema.funcionarios)
    .innerJoin(
      esquema.personas,
      eq(esquema.funcionarios.personaId, esquema.personas.id)
    );

  if (filtros?.escuelaId) {
    return base
      .innerJoin(
        esquema.funcionarioEscuela,
        eq(esquema.funcionarios.id, esquema.funcionarioEscuela.funcionarioId)
      )
      .where(eq(esquema.funcionarioEscuela.escuelaId, filtros.escuelaId));
  }

  return base;
}

export async function obtenerFuncionarioPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaFuncionarioConPersona | undefined> {
  const resultado = await db
    .select(seleccionFuncionario)
    .from(esquema.funcionarios)
    .innerJoin(
      esquema.personas,
      eq(esquema.funcionarios.personaId, esquema.personas.id)
    )
    .where(eq(esquema.funcionarios.id, id));

  return resultado[0];
}

export async function crearFuncionario(
  db: LibSQLDatabase<typeof esquema>,
  datos: { personaId: number; puesto: string }
): Promise<FilaFuncionarioConPersona> {
  const [funcionario] = await db
    .insert(esquema.funcionarios)
    .values({ personaId: datos.personaId, puesto: datos.puesto })
    .returning()
    .all();

  const persona = await db
    .select()
    .from(esquema.personas)
    .where(eq(esquema.personas.id, datos.personaId))
    .then((r) => r[0]);

  return {
    id: funcionario.id,
    personaId: funcionario.personaId,
    puesto: funcionario.puesto,
    identificacion: persona!.identificacion,
    nombres: persona!.nombres,
    apellidos: persona!.apellidos,
  };
}

export async function actualizarFuncionario(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  datos: { puesto?: string }
): Promise<FilaFuncionarioConPersona | undefined> {
  const [funcionario] = await db
    .update(esquema.funcionarios)
    .set(datos)
    .where(eq(esquema.funcionarios.id, id))
    .returning()
    .all();

  if (!funcionario) return undefined;

  return obtenerFuncionarioPorId(db, id);
}

export async function asignarFuncionarioAEscuela(
  db: LibSQLDatabase<typeof esquema>,
  funcionarioId: number,
  escuelaId: number
): Promise<FilaAsignacionEscuela> {
  const [asignacion] = await db
    .insert(esquema.funcionarioEscuela)
    .values({ funcionarioId, escuelaId })
    .returning()
    .all();
  return asignacion;
}

export async function removerFuncionarioDeEscuela(
  db: LibSQLDatabase<typeof esquema>,
  funcionarioId: number,
  escuelaId: number
): Promise<void> {
  await db
    .delete(esquema.funcionarioEscuela)
    .where(
      and(
        eq(esquema.funcionarioEscuela.funcionarioId, funcionarioId),
        eq(esquema.funcionarioEscuela.escuelaId, escuelaId)
      )
    );
}

export async function listarEscuelasDeFuncionario(
  db: LibSQLDatabase<typeof esquema>,
  funcionarioId: number
): Promise<FilaAsignacionEscuela[]> {
  return db
    .select()
    .from(esquema.funcionarioEscuela)
    .where(eq(esquema.funcionarioEscuela.funcionarioId, funcionarioId));
}
