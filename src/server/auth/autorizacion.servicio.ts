import type {
  SesionUsuario,
  NivelRol,
  AmbitoVerificacion,
  ResultadoVerificacion,
} from "./tipos";

export function verificarRol(
  sesion: SesionUsuario | null,
  nivelMinimo: NivelRol,
  ambito?: AmbitoVerificacion
): ResultadoVerificacion {
  if (!sesion) {
    return { autorizado: false, error: 401 };
  }

  if (sesion.nivel > nivelMinimo) {
    return { autorizado: false, error: 403 };
  }

  if (ambito) {
    if (sesion.nivel === 1) {
      return { autorizado: true, usuario: sesion };
    }

    if (ambito.regionId !== undefined && sesion.regionId !== ambito.regionId) {
      return { autorizado: false, error: 403 };
    }

    if (
      ambito.escuelaId !== undefined &&
      sesion.nivel > 2 &&
      sesion.escuelaId !== ambito.escuelaId
    ) {
      return { autorizado: false, error: 403 };
    }
  }

  return { autorizado: true, usuario: sesion };
}
