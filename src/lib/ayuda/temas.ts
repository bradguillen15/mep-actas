import type { NivelRol } from "@/server/auth/tipos";

export interface TemaAyuda {
  slug: string;
  titulo: string;
  descripcion: string;
  niveles: NivelRol[];
  orden: number;
  palabrasClave: string[];
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function temasVisiblesPara(
  temas: readonly TemaAyuda[],
  nivel: NivelRol
): TemaAyuda[] {
  return temas
    .filter((tema) => tema.niveles.includes(nivel))
    .sort((a, b) => a.orden - b.orden);
}

export function buscarTemas(
  temas: readonly TemaAyuda[],
  consulta: string
): TemaAyuda[] {
  const consultaNormalizada = normalizar(consulta);
  if (consultaNormalizada === "") return [...temas];

  return temas.filter((tema) =>
    [tema.titulo, tema.descripcion, ...tema.palabrasClave].some((campo) =>
      normalizar(campo).includes(consultaNormalizada)
    )
  );
}
