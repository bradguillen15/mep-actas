import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaUsuario = typeof esquema.usuarios.$inferSelect;

export type FilaUsuarioConRol = Pick<
  FilaUsuario,
  "id" | "email" | "passwordHash" | "funcionarioId" | "rolId"
> & {
  nivel: number;
};

export type FilaUsuarioLista = Pick<
  FilaUsuario,
  "id" | "email" | "activo" | "funcionarioId" | "rolId"
> & {
  nivel: number;
  funcionarioNombres: string;
  funcionarioApellidos: string;
  funcionarioPuesto: string;
};

export type DatosNuevoUsuario = {
  funcionarioId: number;
  rolId: number;
  email: string;
  passwordHash: string;
};

export async function listarUsuarios(
  db: LibSQLDatabase<typeof esquema>
): Promise<FilaUsuarioLista[]> {
  return db
    .select({
      id: esquema.usuarios.id,
      email: esquema.usuarios.email,
      activo: esquema.usuarios.activo,
      funcionarioId: esquema.usuarios.funcionarioId,
      rolId: esquema.usuarios.rolId,
      nivel: esquema.roles.nivel,
      funcionarioNombres: esquema.personas.nombres,
      funcionarioApellidos: esquema.personas.apellidos,
      funcionarioPuesto: esquema.funcionarios.puesto,
    })
    .from(esquema.usuarios)
    .innerJoin(esquema.roles, eq(esquema.usuarios.rolId, esquema.roles.id))
    .innerJoin(
      esquema.funcionarios,
      eq(esquema.usuarios.funcionarioId, esquema.funcionarios.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.funcionarios.personaId, esquema.personas.id)
    );
}

export async function obtenerUsuarioPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaUsuarioLista | undefined> {
  const resultado = await db
    .select({
      id: esquema.usuarios.id,
      email: esquema.usuarios.email,
      activo: esquema.usuarios.activo,
      funcionarioId: esquema.usuarios.funcionarioId,
      rolId: esquema.usuarios.rolId,
      nivel: esquema.roles.nivel,
      funcionarioNombres: esquema.personas.nombres,
      funcionarioApellidos: esquema.personas.apellidos,
      funcionarioPuesto: esquema.funcionarios.puesto,
    })
    .from(esquema.usuarios)
    .innerJoin(esquema.roles, eq(esquema.usuarios.rolId, esquema.roles.id))
    .innerJoin(
      esquema.funcionarios,
      eq(esquema.usuarios.funcionarioId, esquema.funcionarios.id)
    )
    .innerJoin(
      esquema.personas,
      eq(esquema.funcionarios.personaId, esquema.personas.id)
    )
    .where(eq(esquema.usuarios.id, id));

  return resultado[0];
}

export async function obtenerUsuarioPorEmail(
  db: LibSQLDatabase<typeof esquema>,
  email: string
): Promise<FilaUsuarioConRol | undefined> {
  const resultado = await db
    .select({
      id: esquema.usuarios.id,
      email: esquema.usuarios.email,
      passwordHash: esquema.usuarios.passwordHash,
      funcionarioId: esquema.usuarios.funcionarioId,
      rolId: esquema.usuarios.rolId,
      nivel: esquema.roles.nivel,
    })
    .from(esquema.usuarios)
    .innerJoin(esquema.roles, eq(esquema.usuarios.rolId, esquema.roles.id))
    .where(eq(esquema.usuarios.email, email));

  return resultado[0];
}

export type AmbitoFuncionario = {
  escuelaIds: number[];
  regionIds: number[];
};

export async function obtenerNivelDeRol(
  db: LibSQLDatabase<typeof esquema>,
  rolId: number
): Promise<number | undefined> {
  const resultado = await db
    .select({ nivel: esquema.roles.nivel })
    .from(esquema.roles)
    .where(eq(esquema.roles.id, rolId));

  return resultado[0]?.nivel;
}

export async function obtenerAmbitoDeFuncionario(
  db: LibSQLDatabase<typeof esquema>,
  funcionarioId: number
): Promise<AmbitoFuncionario> {
  const filas = await db
    .select({
      escuelaId: esquema.funcionarioEscuela.escuelaId,
      regionId: esquema.escuelas.regionId,
    })
    .from(esquema.funcionarioEscuela)
    .innerJoin(
      esquema.escuelas,
      eq(esquema.funcionarioEscuela.escuelaId, esquema.escuelas.id)
    )
    .where(eq(esquema.funcionarioEscuela.funcionarioId, funcionarioId));

  return {
    escuelaIds: [...new Set(filas.map((f) => f.escuelaId))],
    regionIds: [...new Set(filas.map((f) => f.regionId))],
  };
}

export async function crearUsuario(
  db: LibSQLDatabase<typeof esquema>,
  datos: DatosNuevoUsuario
): Promise<FilaUsuario> {
  const [usuario] = await db
    .insert(esquema.usuarios)
    .values(datos)
    .returning()
    .all();
  return usuario;
}

export async function actualizarPassword(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  passwordHash: string
): Promise<void> {
  await db
    .update(esquema.usuarios)
    .set({ passwordHash })
    .where(eq(esquema.usuarios.id, id));
}

export async function cambiarEstadoUsuario(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  activo: boolean
): Promise<FilaUsuario | undefined> {
  const [usuario] = await db
    .update(esquema.usuarios)
    .set({ activo })
    .where(eq(esquema.usuarios.id, id))
    .returning()
    .all();
  return usuario;
}
