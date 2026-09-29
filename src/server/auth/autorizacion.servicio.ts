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

  if (ambito && !ambitoPermitido(sesion, ambito)) {
    return { autorizado: false, error: 403 };
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
