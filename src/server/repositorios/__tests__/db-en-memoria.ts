import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as esquema from "@/db/esquema";

export async function crearDbEnMemoria() {
  const cliente = createClient({ url: ":memory:" });
  const db = drizzle(cliente, { schema: esquema });
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../../../../drizzle"),
  });
  return db;
}

export type DbEnMemoria = Awaited<ReturnType<typeof crearDbEnMemoria>>;
