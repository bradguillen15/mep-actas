export interface AlmacenamientoEscaneos {
  generarUrlLectura: (clave: string) => Promise<string>;
  generarUrlSubida: (clave: string, tipoContenido: string) => Promise<string>;
}
