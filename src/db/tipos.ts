import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as esquema from "./esquema";

export type BaseDeDatos = LibSQLDatabase<typeof esquema>;

export type TransaccionDb = Parameters<
  Parameters<BaseDeDatos["transaction"]>[0]
>[0];

export type ConexionDb = BaseDeDatos | TransaccionDb;
