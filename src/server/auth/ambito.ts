import type { AmbitoVerificacion, SesionUsuario } from "./tipos";

export type AmbitoConsulta =
  | { tipo: "pais" }
  | { tipo: "region"; regionId: number }
  | { tipo: "escuela"; escuelaId: number }
  | { tipo: "ninguno" };

export function derivarAmbitoConsulta(sesion: SesionUsuario): AmbitoConsulta {
  if (sesion.nivel === 1) return { tipo: "pais" };
  if (sesion.nivel === 2) {
    return sesion.regionId !== undefined
      ? { tipo: "region", regionId: sesion.regionId }
      : { tipo: "ninguno" };
  }
  return sesion.escuelaId !== undefined
    ? { tipo: "escuela", escuelaId: sesion.escuelaId }
    : { tipo: "ninguno" };
}

export function escuelasDentroDeAmbito(
  ambito: AmbitoConsulta,
  escuelaIds: number[],
  regionIds: number[]
): boolean {
  switch (ambito.tipo) {
    case "pais":
      return true;
    case "region":
      return regionIds.includes(ambito.regionId);
    case "escuela":
      return escuelaIds.includes(ambito.escuelaId);
    case "ninguno":
      return false;
  }
}

export type ResolverAmbitoDeEscuela = (
  escuelaId: number
) => Promise<{ escuelaId: number; regionId: number } | undefined>;

export async function ambitoDeEscuelaObjetivo(
  sesion: SesionUsuario,
  escuelaId: number,
  resolver: ResolverAmbitoDeEscuela
): Promise<AmbitoVerificacion> {
  if (sesion.nivel !== 2) return { escuelaId };
  const escuela = await resolver(escuelaId);
  return escuela ? { escuelaId, regionId: escuela.regionId } : { escuelaId };
}
