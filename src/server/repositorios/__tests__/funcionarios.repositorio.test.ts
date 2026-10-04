import { describe, it, expect, beforeAll } from "vitest";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import { listarFuncionarios, obtenerFuncionarioPorId } from "../funcionarios.repositorio";
import { crearDbEnMemoria, type DbEnMemoria } from "./db-en-memoria";
import { sembrarEscenarioDeAmbito } from "./datos-ambito";

let db: DbEnMemoria;

beforeAll(async () => {
  db = await crearDbEnMemoria();
  await sembrarEscenarioDeAmbito(db);
});

async function idsVisibles(ambito: AmbitoConsulta, escuelaId?: number) {
  const filas = await listarFuncionarios(db, { escuelaId }, ambito);
  return filas.map((fila) => fila.id).sort((a, b) => a - b);
}

describe("funcionarios con ámbito", () => {
  it("el país ve a todos", async () => {
    expect(await idsVisibles({ tipo: "pais" })).toEqual([2, 3, 6]);
  });

  it("la escuela ve solo a los asignados a ella", async () => {
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 10 })).toEqual([6]);
  });

  it("la región no duplica a un funcionario de varias escuelas", async () => {
    expect(await idsVisibles({ tipo: "region", regionId: 1 })).toEqual([3, 6]);
  });

  it("el filtro de escuela del cliente solo estrecha el resultado", async () => {
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 10 }, 11)).toEqual([]);
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 10 }, 20)).toEqual([6]);
    expect(await idsVisibles({ tipo: "pais" }, 10)).toEqual([6]);
  });

  it("un funcionario sin asignación solo lo ve el país", async () => {
    expect(await obtenerFuncionarioPorId(db, 2, { tipo: "region", regionId: 2 })).toBeUndefined();
    expect(await obtenerFuncionarioPorId(db, 2, { tipo: "pais" })).toBeDefined();
  });

  it("un funcionario de otra región no es visible", async () => {
    expect(await obtenerFuncionarioPorId(db, 3, { tipo: "region", regionId: 2 })).toBeUndefined();
  });
});
