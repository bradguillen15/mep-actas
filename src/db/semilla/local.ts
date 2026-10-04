import fs from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as esquema from "../esquema";
import { migrarBaseDeDatos } from "./migrar";
import { sembrarBaseDeDatos, type ResumenSemilla } from "./sembrar";
import { resolverUrlLocal } from "./url-local";
import { crearGeneradorImagenesEscaneo } from "./imagenes";
import { directorioAlmacenamientoLocal } from "../../server/almacenamiento/local";

export type OpcionesSemillaLocal = {
  urlBaseDeDatos: string | undefined;
  reiniciar: boolean;
  directorioAlmacenamiento?: string;
  rondasHash?: number;
};

export type ResultadoSemillaLocal = ResumenSemilla & { rutaBaseDeDatos: string };

export async function ejecutarSemillaLocal(
  opciones: OpcionesSemillaLocal
): Promise<ResultadoSemillaLocal> {
  const url = resolverUrlLocal(opciones.urlBaseDeDatos);
  const rutaBaseDeDatos = url.replace(/^file:/, "");
  const directorioAlmacenamiento =
    opciones.directorioAlmacenamiento ?? directorioAlmacenamientoLocal();

  if (opciones.reiniciar) {
    for (const sufijo of ["", "-wal", "-shm"]) {
      fs.rmSync(`${rutaBaseDeDatos}${sufijo}`, { force: true });
    }
    fs.rmSync(directorioAlmacenamiento, { recursive: true, force: true });
  }

  const cliente = createClient({ url });
  try {
    const db = drizzle(cliente, { schema: esquema });
    await migrarBaseDeDatos(db);
    const resumen = await sembrarBaseDeDatos(db, {
      rondasHash: opciones.rondasHash,
      generarImagenEscaneo: crearGeneradorImagenesEscaneo(directorioAlmacenamiento),
    });
    return { ...resumen, rutaBaseDeDatos };
  } finally {
    cliente.close();
  }
}
