import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  actaEstudiantes,
  actaFirmantes,
  actas,
  escuelas,
  estudiantes,
  funcionarioEscuela,
  funcionarios,
} from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";

export function condicionEscuelaEnAmbito(
  ambito: AmbitoConsulta,
  columnaEscuelaId: SQLiteColumn
): SQL | undefined {
  switch (ambito.tipo) {
    case "pais":
      return undefined;
    case "region":
      return inArray(
        columnaEscuelaId,
        sql`(select ${escuelas.id} from ${escuelas} where ${escuelas.regionId} = ${ambito.regionId})`
      );
    case "escuela":
      return eq(columnaEscuelaId, ambito.escuelaId);
    case "ninguno":
      return sql`0 = 1`;
  }
}

export function condicionFuncionarioEnAmbito(
  ambito: AmbitoConsulta,
  columnaFuncionarioId: SQLiteColumn
): SQL | undefined {
  if (ambito.tipo === "pais") return undefined;
  return sql`exists (select 1 from ${funcionarioEscuela} where ${and(
    eq(funcionarioEscuela.funcionarioId, columnaFuncionarioId),
    condicionEscuelaEnAmbito(ambito, funcionarioEscuela.escuelaId)
  )})`;
}

export function condicionPersonaEnAmbito(
  ambito: AmbitoConsulta,
  columnaPersonaId: SQLiteColumn
): SQL | undefined {
  if (ambito.tipo === "pais") return undefined;
  const escuelaDelActa = condicionEscuelaEnAmbito(ambito, actas.escuelaId);
  return or(
    sql`exists (select 1 from ${estudiantes}
      inner join ${actaEstudiantes} on ${actaEstudiantes.estudianteId} = ${estudiantes.id}
      inner join ${actas} on ${actas.id} = ${actaEstudiantes.actaId}
      where ${and(eq(estudiantes.personaId, columnaPersonaId), escuelaDelActa)})`,
    sql`exists (select 1 from ${funcionarios}
      inner join ${actaFirmantes} on ${actaFirmantes.funcionarioId} = ${funcionarios.id}
      inner join ${actas} on ${actas.id} = ${actaFirmantes.actaId}
      where ${and(eq(funcionarios.personaId, columnaPersonaId), escuelaDelActa)})`,
    sql`exists (select 1 from ${funcionarios}
      where ${and(
        eq(funcionarios.personaId, columnaPersonaId),
        condicionFuncionarioEnAmbito(ambito, funcionarios.id)
      )})`
  );
}
