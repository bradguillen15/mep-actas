/* eslint-disable security/detect-non-literal-fs-filename -- las rutas se validan con resolverRutaLocal */
import fs from "fs/promises";
import path from "path";
import type { AlmacenamientoEscaneos } from "./puerto";
import { tipoContenidoDeExtension } from "@/lib/escaneos";

export const PREFIJO_RUTA_LOCAL = "/api/almacenamiento-local";

const PATRON_CLAVE = /^escaneos\/\d+\/\d+\/\d+\.(jpg|jpeg|png|pdf)$/;

export function directorioAlmacenamientoLocal(
  entorno: Record<string, string | undefined> = process.env
): string {
  return (
    entorno.ALMACENAMIENTO_LOCAL_DIR ?? path.join(process.cwd(), ".almacenamiento-local")
  );
}

export function resolverRutaLocal(directorioBase: string, clave: string): string {
  if (!PATRON_CLAVE.test(clave)) {
    throw new Error(`Clave de almacenamiento inválida: ${clave}`);
  }
  const base = path.resolve(directorioBase);
  const ruta = path.resolve(base, clave);
  if (!ruta.startsWith(base + path.sep)) {
    throw new Error(`Clave de almacenamiento inválida: ${clave}`);
  }
  return ruta;
}

export async function escribirArchivoLocal(
  directorioBase: string,
  clave: string,
  contenido: Buffer
): Promise<void> {
  const ruta = resolverRutaLocal(directorioBase, clave);
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, contenido);
}

export async function existeArchivoLocal(
  directorioBase: string,
  clave: string
): Promise<boolean> {
  try {
    await fs.access(resolverRutaLocal(directorioBase, clave));
    return true;
  } catch {
    return false;
  }
}

export async function leerArchivoLocal(
  directorioBase: string,
  clave: string
): Promise<{ contenido: Buffer; tipoContenido: string } | undefined> {
  const ruta = resolverRutaLocal(directorioBase, clave);
  try {
    const contenido = await fs.readFile(ruta);
    return {
      contenido,
      tipoContenido: tipoContenidoDeExtension(path.extname(ruta).slice(1)),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export function crearAlmacenamientoLocal(): AlmacenamientoEscaneos {
  const urlDeClave = async (clave: string) => `${PREFIJO_RUTA_LOCAL}/${clave}`;
  return {
    generarUrlLectura: urlDeClave,
    generarUrlSubida: (clave) => urlDeClave(clave),
  };
}
