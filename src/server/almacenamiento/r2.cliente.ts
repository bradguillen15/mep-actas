import { S3Client } from "@aws-sdk/client-s3";

let instancia: S3Client | null = null;

export function crearClienteR2(): S3Client {
  if (instancia) return instancia;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    const faltantes = [
      !accountId && "R2_ACCOUNT_ID",
      !accessKeyId && "R2_ACCESS_KEY_ID",
      !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Faltan variables de entorno para Cloudflare R2: ${faltantes}`
    );
  }

  instancia = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return instancia;
}
