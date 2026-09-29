import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { eq, or, like } from "drizzle-orm";
import * as esquema from "@/db/esquema";

export type FilaPersona = typeof esquema.personas.$inferSelect;
export type DatosNuevaPersona = Pick<
  typeof esquema.personas.$inferInsert,
  "identificacion" | "nombres" | "apellidos"
>;

export async function listarPersonas(
  db: LibSQLDatabase<typeof esquema>,
  busqueda?: string
): Promise<FilaPersona[]> {
  if (busqueda) {
    return db
      .select()
      .from(esquema.personas)
      .where(
        or(
          like(esquema.personas.identificacion, `%${busqueda}%`),
          like(esquema.personas.nombres, `%${busqueda}%`),
          like(esquema.personas.apellidos, `%${busqueda}%`)
        )
      );
  }
  return db.select().from(esquema.personas);
}

export async function obtenerPersonaPorId(
  db: LibSQLDatabase<typeof esquema>,
  id: number
): Promise<FilaPersona | undefined> {
  const resultado = await db
    .select()
    .from(esquema.personas)
    .where(eq(esquema.personas.id, id));
  return resultado[0];
}

export async function obtenerPersonaPorIdentificacion(
  db: LibSQLDatabase<typeof esquema>,
  identificacion: string
): Promise<FilaPersona | undefined> {
  const resultado = await db
    .select()
    .from(esquema.personas)
    .where(eq(esquema.personas.identificacion, identificacion));
  return resultado[0];
}

export type PersonaMinima = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
};

export async function obtenerPersonaMinimaPorIdentificacion(
  db: LibSQLDatabase<typeof esquema>,
  identificacion: string
): Promise<PersonaMinima | undefined> {
  const resultado = await db
    .select({
      id: esquema.personas.id,
      nombres: esquema.personas.nombres,
      apellidos: esquema.personas.apellidos,
      identificacion: esquema.personas.identificacion,
    })
    .from(esquema.personas)
    .where(eq(esquema.personas.identificacion, identificacion));
  return resultado[0];
}

export async function crearPersona(
  db: LibSQLDatabase<typeof esquema>,
  datos: DatosNuevaPersona
): Promise<FilaPersona> {
  const [persona] = await db
    .insert(esquema.personas)
    .values(datos)
    .returning()
    .all();
  return persona;
}

export async function actualizarPersona(
  db: LibSQLDatabase<typeof esquema>,
  id: number,
  datos: Partial<DatosNuevaPersona>
): Promise<FilaPersona | undefined> {
  const [persona] = await db
    .update(esquema.personas)
    .set(datos)
    .where(eq(esquema.personas.id, id))
    .returning()
    .all();
  return persona;
}
