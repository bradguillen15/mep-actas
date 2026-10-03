import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as esquema from "../../src/db/esquema";
import { migrarBaseDeDatos } from "../../src/db/semilla/migrar";
import { sembrarBaseDeDatos } from "../../src/db/semilla/sembrar";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
const RONDAS_HASH_RAPIDAS = 4;

function eliminarArchivosDeBaseDeDatos() {
  for (const archivo of [DB_PATH, DB_PATH + "-wal", DB_PATH + "-shm"]) {
    fs.rmSync(archivo, { force: true });
  }
}

export async function setup() {
  eliminarArchivosDeBaseDeDatos();
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client, { schema: esquema });

  await migrarBaseDeDatos(db);
  await sembrarBaseDeDatos(db, { rondasHash: RONDAS_HASH_RAPIDAS });

  client.close();
}

export async function teardown() {
  eliminarArchivosDeBaseDeDatos();
}
