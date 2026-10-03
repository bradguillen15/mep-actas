import fs from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as esquema from "../esquema";
import { migrarBaseDeDatos } from "./migrar";
import { sembrarBaseDeDatos, type ResumenSemilla } from "./sembrar";
import { resolverUrlLocal } from "./url-local";

export type OpcionesSemillaLocal = {
  urlBaseDeDatos: string | undefined;
  reiniciar: boolean;
};

export type ResultadoSemillaLocal = ResumenSemilla & { rutaBaseDeDatos: string };

export async function ejecutarSemillaLocal(
  opciones: OpcionesSemillaLocal
): Promise<ResultadoSemillaLocal> {
  const url = resolverUrlLocal(opciones.urlBaseDeDatos);
  const rutaBaseDeDatos = url.replace(/^file:/, "");

  if (opciones.reiniciar) {
    for (const sufijo of ["", "-wal", "-shm"]) {
      fs.rmSync(`${rutaBaseDeDatos}${sufijo}`, { force: true });
    }
  }

  const cliente = createClient({ url });
  try {
    const db = drizzle(cliente, { schema: esquema });
    await migrarBaseDeDatos(db);
    const resumen = await sembrarBaseDeDatos(db);
    return { ...resumen, rutaBaseDeDatos };
  } finally {
    cliente.close();
  }
}
