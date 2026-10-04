import type { AlmacenamientoEscaneos } from "./puerto";
import { generarUrlLectura, generarUrlSubida } from "./r2.util";

export function crearAlmacenamientoR2(): AlmacenamientoEscaneos {
  return {
    generarUrlLectura: (clave) => generarUrlLectura(clave),
    generarUrlSubida: (clave, tipoContenido) => generarUrlSubida(clave, tipoContenido),
  };
}
