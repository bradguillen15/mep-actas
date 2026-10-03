import type {
  SesionUsuario,
  NivelRol,
  AmbitoVerificacion,
  ResultadoVerificacion,
} from "./tipos";

export const MENSAJE_NO_AUTENTICADO = "No autorizado";
export const MENSAJE_SIN_PERMISOS =
  "No tiene permisos para realizar esta acción";
export const MENSAJE_FUERA_DE_AMBITO =
  "No tiene permisos sobre esta escuela o región";

export function verificarRol(
  sesion: SesionUsuario | null,
  nivelMinimo: NivelRol,
  ambito?: AmbitoVerificacion
): ResultadoVerificacion {
  if (!sesion) {
    return { autorizado: false, estado: 401, mensaje: MENSAJE_NO_AUTENTICADO };
  }

  if (sesion.nivel > nivelMinimo) {
    return { autorizado: false, estado: 403, mensaje: MENSAJE_SIN_PERMISOS };
  }

  if (ambito && !ambitoPermitido(sesion, ambito)) {
    return {
      autorizado: false,
      estado: 403,
      mensaje: MENSAJE_FUERA_DE_AMBITO,
    };
  }

  return { autorizado: true, usuario: sesion };
}

function ambitoPermitido(
  sesion: SesionUsuario,
  ambito: AmbitoVerificacion
): boolean {
  if (sesion.nivel === 1) return true;

  if (ambito.escuelaId !== undefined) {
    if (sesion.nivel === 2) {
      return ambito.regionId !== undefined && ambito.regionId === sesion.regionId;
    }
    return ambito.escuelaId === sesion.escuelaId;
  }

  if (ambito.regionId !== undefined) {
    return ambito.regionId === sesion.regionId;
  }

  return true;
}
