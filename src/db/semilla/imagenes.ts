import sharp from "sharp";
import {
  escribirArchivoLocal,
  existeArchivoLocal,
} from "../../server/almacenamiento/local";
import type { DatosImagenEscaneo, GeneradorImagenEscaneo } from "./sembrar";

const ANCHO = 800;
const ALTO = 1100;

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function renderizarImagenFolio(datos: DatosImagenEscaneo): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
  <rect width="${ANCHO}" height="${ALTO}" fill="#f7f3e8"/>
  <rect x="30" y="30" width="${ANCHO - 60}" height="${ALTO - 60}" fill="none" stroke="#172b54" stroke-width="4"/>
  <text x="${ANCHO / 2}" y="${ALTO / 2 - 20}" font-family="sans-serif" font-size="72" font-weight="bold" fill="#172b54" text-anchor="middle">Tomo ${datos.numeroTomo} · Folio ${datos.numeroFolio}</text>
  <text x="${ANCHO / 2}" y="${ALTO / 2 + 50}" font-family="sans-serif" font-size="36" fill="#6b5a2c" text-anchor="middle">${escaparXml(datos.nombreEscuela)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function crearGeneradorImagenesEscaneo(directorioBase: string): GeneradorImagenEscaneo {
  return async (datos) => {
    if (await existeArchivoLocal(directorioBase, datos.clave)) return false;
    await escribirArchivoLocal(directorioBase, datos.clave, await renderizarImagenFolio(datos));
    return true;
  };
}
