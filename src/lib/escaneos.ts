const TIPOS_CONTENIDO_POR_EXTENSION: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export const EXTENSIONES_PERMITIDAS: readonly string[] = Object.keys(TIPOS_CONTENIDO_POR_EXTENSION);

export const TIPOS_CONTENIDO_PERMITIDOS: readonly string[] = [
  ...new Set(Object.values(TIPOS_CONTENIDO_POR_EXTENSION)),
];

export function tipoContenidoDeExtension(extension: string): string {
  const tipo = TIPOS_CONTENIDO_POR_EXTENSION[extension.toLowerCase()];
  if (!tipo) {
    throw new Error(
      `Extensión no permitida: ${extension}. Use: ${Object.keys(TIPOS_CONTENIDO_POR_EXTENSION).join(", ")}`
    );
  }
  return tipo;
}

export function extensionDeArchivo(nombreArchivo: string): string {
  const posicion = nombreArchivo.lastIndexOf(".");
  return posicion === -1 ? "" : nombreArchivo.slice(posicion + 1).toLowerCase();
}

export function tipoContenidoDeArchivo(nombreArchivo: string): string | null {
  return TIPOS_CONTENIDO_POR_EXTENSION[extensionDeArchivo(nombreArchivo)] ?? null;
}

export function extensionPermitida(nombreArchivo: string): boolean {
  return tipoContenidoDeArchivo(nombreArchivo) !== null;
}
