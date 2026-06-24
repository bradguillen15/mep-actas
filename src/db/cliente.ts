import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as esquema from "./esquema";

let instancia: LibSQLDatabase<typeof esquema> | null = null;

export function clienteDb() {
  if (instancia) return instancia;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "Falta TURSO_DATABASE_URL en las variables de entorno"
    );
  }

  const clienteSql = createClient({
    url,
    authToken,
  });

  instancia = drizzle(clienteSql, { schema: esquema });
  return instancia;
}
