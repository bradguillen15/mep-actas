import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as esquema from "./esquema";

let instancia: LibSQLDatabase<typeof esquema> | null = null;

function resolverUrlBaseDeDatos(): string | undefined {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  if (process.env.NODE_ENV === "development") {
    return "file:./mep-actas-local.db";
  }

  return undefined;
}

export function clienteDb() {
  if (instancia) return instancia;

  const url = resolverUrlBaseDeDatos();
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

  void clienteSql.execute("PRAGMA foreign_keys = ON");

  instancia = drizzle(clienteSql, { schema: esquema });
  return instancia;
}
