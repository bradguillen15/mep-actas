import { describe, it, expect } from "vitest";
import type { SesionUsuario } from "../tipos";
import {
  derivarAmbitoConsulta,
  escuelasDentroDeAmbito,
  ambitoDeEscuelaObjetivo,
  type AmbitoConsulta,
} from "../ambito";

function crearSesion(parcial: Partial<SesionUsuario>): SesionUsuario {
  return {
    usuarioId: 1,
    email: "usuario@mep.go.cr",
    rolId: 1,
    nivel: 1,
    funcionarioId: 1,
    ...parcial,
  };
}

describe("derivarAmbitoConsulta", () => {
  it.each<[string, Partial<SesionUsuario>, AmbitoConsulta]>([
    ["nivel 1 obtiene ámbito país", { nivel: 1 }, { tipo: "pais" }],
    [
      "nivel 2 con región obtiene ámbito región",
      { nivel: 2, regionId: 5 },
      { tipo: "region", regionId: 5 },
    ],
    ["nivel 2 sin región falla cerrado", { nivel: 2 }, { tipo: "ninguno" }],
    [
      "nivel 3 con escuela obtiene ámbito escuela",
      { nivel: 3, escuelaId: 10 },
      { tipo: "escuela", escuelaId: 10 },
    ],
    [
      "nivel 4 con escuela obtiene ámbito escuela",
      { nivel: 4, escuelaId: 10 },
      { tipo: "escuela", escuelaId: 10 },
    ],
    ["nivel 3 sin escuela falla cerrado", { nivel: 3 }, { tipo: "ninguno" }],
    ["nivel 4 sin escuela falla cerrado", { nivel: 4 }, { tipo: "ninguno" }],
    [
      "nivel 3 ignora la región y usa su escuela",
      { nivel: 3, escuelaId: 10, regionId: 5 },
      { tipo: "escuela", escuelaId: 10 },
    ],
  ])("%s", (_descripcion, parcial, esperado) => {
    expect(derivarAmbitoConsulta(crearSesion(parcial))).toEqual(esperado);
  });
});

describe("escuelasDentroDeAmbito", () => {
  const escuelaIds = [10, 11];
  const regionIds = [5];

  it("el ámbito país abarca cualquier escuela", () => {
    expect(escuelasDentroDeAmbito({ tipo: "pais" }, [], [])).toBe(true);
  });

  it("el ámbito región abarca escuelas de esa región", () => {
    expect(
      escuelasDentroDeAmbito({ tipo: "region", regionId: 5 }, escuelaIds, regionIds)
    ).toBe(true);
  });

  it("el ámbito región excluye escuelas de otra región", () => {
    expect(
      escuelasDentroDeAmbito({ tipo: "region", regionId: 6 }, escuelaIds, regionIds)
    ).toBe(false);
  });

  it("el ámbito escuela abarca su propia escuela", () => {
    expect(
      escuelasDentroDeAmbito({ tipo: "escuela", escuelaId: 11 }, escuelaIds, regionIds)
    ).toBe(true);
  });

  it("el ámbito escuela excluye otras escuelas", () => {
    expect(
      escuelasDentroDeAmbito({ tipo: "escuela", escuelaId: 12 }, escuelaIds, regionIds)
    ).toBe(false);
  });

  it("el ámbito ninguno no abarca nada", () => {
    expect(escuelasDentroDeAmbito({ tipo: "ninguno" }, escuelaIds, regionIds)).toBe(
      false
    );
  });
});

describe("ambitoDeEscuelaObjetivo", () => {
  it("para nivel 2 incluye la región resuelta de la escuela", async () => {
    const resolver = async () => ({ escuelaId: 7, regionId: 5 });
    const ambito = await ambitoDeEscuelaObjetivo(
      crearSesion({ nivel: 2, regionId: 5 }),
      7,
      resolver
    );
    expect(ambito).toEqual({ escuelaId: 7, regionId: 5 });
  });

  it("para nivel 2 omite la región si la escuela no existe", async () => {
    const ambito = await ambitoDeEscuelaObjetivo(
      crearSesion({ nivel: 2, regionId: 5 }),
      999,
      async () => undefined
    );
    expect(ambito).toEqual({ escuelaId: 999 });
  });

  it("para niveles 1, 3 y 4 no consulta la región", async () => {
    let consultas = 0;
    const resolver = async () => {
      consultas += 1;
      return { escuelaId: 7, regionId: 5 };
    };
    for (const nivel of [1, 3, 4] as const) {
      const ambito = await ambitoDeEscuelaObjetivo(
        crearSesion({ nivel, escuelaId: 7 }),
        7,
        resolver
      );
      expect(ambito).toEqual({ escuelaId: 7 });
    }
    expect(consultas).toBe(0);
  });
});
