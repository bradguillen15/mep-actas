import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");

export async function setup() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });

  const { rows } = await db.run(sql`SELECT COUNT(*) as cnt FROM roles`);
  const cnt = Number(rows?.[0]?.cnt ?? rows?.[0]?.[0] ?? 0);

  if (cnt === 0) {
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin País', 1)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin Regional', 2)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Admin Escuela', 3)`);
    await db.run(sql`INSERT INTO roles (nombre, nivel) VALUES ('Staff', 4)`);
  }

  const { rows: personas } = await db.run(
    sql`SELECT COUNT(*) as cnt FROM personas`
  );
  const cntPersonas = Number(personas?.[0]?.cnt ?? personas?.[0]?.[0] ?? 0);

  if (cntPersonas === 0) {
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('000000000', 'Admin País', 'E2E')`
    );
    await db.run(
      sql`INSERT INTO personas (identificacion, nombres, apellidos) VALUES ('000000001', 'Admin Regional', 'E2E')`
    );

    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (1, 'Admin País')`
    );
    await db.run(
      sql`INSERT INTO funcionarios (persona_id, puesto) VALUES (2, 'Admin Regional')`
    );

    const passwordHash = hashSync("test-password", 10);
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (1, 1, 'admin-pais@e2e.test', ${passwordHash})`
    );
    const passwordHashRegional = hashSync("test-password", 10);
    await db.run(
      sql`INSERT INTO usuarios (funcionario_id, rol_id, email, password_hash) VALUES (2, 2, 'admin-regional@e2e.test', ${passwordHashRegional})`
    );
  }

  client.close();
}

export async function teardown() {
  for (const archivo of [DB_PATH, DB_PATH + "-wal", DB_PATH + "-shm"]) {
    try { fs.unlinkSync(archivo); } catch { /* ignore */ }
  }
}
