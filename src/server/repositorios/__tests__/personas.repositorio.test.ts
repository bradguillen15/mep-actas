import { describe, it, expect, beforeAll } from "vitest";
import * as esquema from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import {
  listarPersonas,
  obtenerPersonaMinimaPorIdentificacion,
  obtenerPersonaPorId,
} from "../personas.repositorio";
import { sembrarEscenarioDeAmbito } from "./datos-ambito";
import { crearDbEnMemoria, type DbEnMemoria } from "./db-en-memoria";

let db: DbEnMemoria;

beforeAll(async () => {
  db = await crearDbEnMemoria();
  await db.insert(esquema.personas).values({
    id: 1,
    identificacion: "101230002",
    nombres: "María",
    apellidos: "González Ruiz",
  });
});

describe("obtenerPersonaMinimaPorIdentificacion", () => {
  it("devuelve solo los campos mínimos ante coincidencia exacta", async () => {
    const persona = await obtenerPersonaMinimaPorIdentificacion(db, "101230002");
    expect(persona).toEqual({
      id: 1,
      identificacion: "101230002",
      nombres: "María",
      apellidos: "González Ruiz",
    });
  });

  it("no coincide con una identificación parcial", async () => {
    expect(await obtenerPersonaMinimaPorIdentificacion(db, "10123")).toBeUndefined();
  });

  it("devuelve undefined si no existe", async () => {
    expect(await obtenerPersonaMinimaPorIdentificacion(db, "999999999")).toBeUndefined();
  });
});

describe("personas con ámbito", () => {
  let dbAmbito: DbEnMemoria;

  beforeAll(async () => {
    dbAmbito = await crearDbEnMemoria();
    await sembrarEscenarioDeAmbito(dbAmbito);
  });

  async function idsVisibles(ambito: AmbitoConsulta, busqueda?: string) {
    const filas = await listarPersonas(dbAmbito, busqueda, ambito);
    return filas.map((fila) => fila.id).sort((a, b) => a - b);
  }

  it("el país ve a todas las personas", async () => {
    expect(await idsVisibles({ tipo: "pais" })).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("la escuela ve estudiantes y funcionarios asignados, sin duplicados", async () => {
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 10 })).toEqual([1, 5, 6]);
  });

  it("incluye a los firmantes de actas del ámbito", async () => {
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 20 })).toEqual([2, 5, 6]);
  });

  it("la región ve por acta y por asignación en sus escuelas", async () => {
    expect(await idsVisibles({ tipo: "region", regionId: 1 })).toEqual([1, 3, 5, 6]);
  });

  it("una persona sin vínculo solo la ve el país", async () => {
    expect(await obtenerPersonaPorId(dbAmbito, 4, { tipo: "region", regionId: 1 })).toBeUndefined();
    expect(await obtenerPersonaPorId(dbAmbito, 4, { tipo: "pais" })).toBeDefined();
  });

  it("la búsqueda parcial no incluye personas fuera del ámbito", async () => {
    expect(await idsVisibles({ tipo: "escuela", escuelaId: 10 }, "Mora")).toEqual([6]);
  });

  it("el ámbito ninguno no ve a nadie", async () => {
    expect(await idsVisibles({ tipo: "ninguno" })).toEqual([]);
  });
});
