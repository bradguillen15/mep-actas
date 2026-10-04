import path from "path";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import type * as esquema from "../esquema";

export async function migrarBaseDeDatos(
  db: LibSQLDatabase<typeof esquema>
): Promise<void> {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../../../drizzle"),
  });
}
