import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { crearClienteR2 } from "./r2.cliente";

const EXTENSIONES_PERMITIDAS = ["jpg", "jpeg", "png", "pdf"];

export function construirClave(
  escuelaId: number,
  tomo: number,
  folio: number,
  extension: string
): string {
  if (escuelaId < 1 || tomo < 1 || folio < 1) {
    throw new Error("escuelaId, tomo y folio deben ser enteros positivos");
  }

  const ext = extension.toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    throw new Error(
      `Extension no permitida: ${extension}. Use: ${EXTENSIONES_PERMITIDAS.join(", ")}`
    );
  }

  return `escaneos/${escuelaId}/${tomo}/${folio}.${ext}`;
}

export async function generarUrlLectura(
  clave: string,
  ttlSegundos = 300
): Promise<string> {
  const cliente = crearClienteR2();
  const bucket = process.env.R2_BUCKET;

  if (!bucket) {
    throw new Error("Falta R2_BUCKET en las variables de entorno");
  }

  const comando = new GetObjectCommand({
    Bucket: bucket,
    Key: clave,
  });

  return getSignedUrl(cliente, comando, { expiresIn: ttlSegundos });
}

export async function generarUrlSubida(
  clave: string,
  tipo: string,
  ttlSegundos = 300
): Promise<string> {
  const cliente = crearClienteR2();
  const bucket = process.env.R2_BUCKET;

  if (!bucket) {
    throw new Error("Falta R2_BUCKET en las variables de entorno");
  }

  const comando = new PutObjectCommand({
    Bucket: bucket,
    Key: clave,
    ContentType: tipo,
  });

  return getSignedUrl(cliente, comando, { expiresIn: ttlSegundos });
}
