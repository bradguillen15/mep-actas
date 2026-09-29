import { describe, it, expect, beforeAll } from "vitest";
import * as esquema from "@/db/esquema";
import { obtenerPersonaMinimaPorIdentificacion } from "../personas.repositorio";
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
