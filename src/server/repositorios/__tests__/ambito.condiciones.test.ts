import { describe, it, expect, beforeAll } from "vitest";
import { asc } from "drizzle-orm";
import { escuelas, regiones } from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import { condicionEscuelaEnAmbito } from "../ambito.condiciones";
import { crearDbEnMemoria, type DbEnMemoria } from "./db-en-memoria";

let db: DbEnMemoria;

beforeAll(async () => {
  db = await crearDbEnMemoria();
  await db.insert(regiones).values([
    { id: 1, nombre: "Región Uno" },
    { id: 2, nombre: "Región Dos" },
  ]);
  await db.insert(escuelas).values([
    { id: 10, regionId: 1, codigoMep: "E10", nombre: "Escuela 10" },
    { id: 11, regionId: 1, codigoMep: "E11", nombre: "Escuela 11" },
    { id: 20, regionId: 2, codigoMep: "E20", nombre: "Escuela 20" },
  ]);
});

async function escuelasVisibles(ambito: AmbitoConsulta): Promise<number[]> {
  const filas = await db
    .select({ id: escuelas.id })
    .from(escuelas)
    .where(condicionEscuelaEnAmbito(ambito, escuelas.id))
    .orderBy(asc(escuelas.id));
  return filas.map((fila) => fila.id);
}

describe("condicionEscuelaEnAmbito", () => {
  it("el ámbito país no agrega condición", async () => {
    expect(condicionEscuelaEnAmbito({ tipo: "pais" }, escuelas.id)).toBeUndefined();
    expect(await escuelasVisibles({ tipo: "pais" })).toEqual([10, 11, 20]);
  });

  it("el ámbito región incluye solo las escuelas de esa región", async () => {
    expect(await escuelasVisibles({ tipo: "region", regionId: 1 })).toEqual([10, 11]);
  });

  it("el ámbito escuela incluye solo esa escuela", async () => {
    expect(await escuelasVisibles({ tipo: "escuela", escuelaId: 11 })).toEqual([11]);
  });

  it("el ámbito ninguno no devuelve filas", async () => {
    expect(await escuelasVisibles({ tipo: "ninguno" })).toEqual([]);
  });
});
