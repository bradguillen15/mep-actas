import { describe, it, expect, beforeAll } from "vitest";
import * as esquema from "@/db/esquema";
import { listarResumenTomos } from "../escaneos.repositorio";
import { crearDbEnMemoria, type DbEnMemoria } from "./db-en-memoria";

let db: DbEnMemoria;

beforeAll(async () => {
  db = await crearDbEnMemoria();
  await db.insert(esquema.regiones).values([
    { id: 1, nombre: "Región Uno" },
    { id: 2, nombre: "Región Dos" },
  ]);
  await db.insert(esquema.escuelas).values([
    { id: 10, regionId: 1, codigoMep: "E10", nombre: "Escuela 10" },
    { id: 20, regionId: 2, codigoMep: "E20", nombre: "Escuela 20" },
  ]);
  await db.insert(esquema.roles).values({ id: 1, nombre: "Admin País", nivel: 1 });
  await db.insert(esquema.personas).values({
    id: 1,
    identificacion: "100000001",
    nombres: "Admin",
    apellidos: "Prueba",
  });
  await db.insert(esquema.funcionarios).values({
    id: 1,
    personaId: 1,
    puesto: "Administrador",
  });
  await db.insert(esquema.usuarios).values({
    id: 1,
    funcionarioId: 1,
    rolId: 1,
    email: "admin@prueba.local",
    passwordHash: "x",
  });
  await db.insert(esquema.escaneos).values([
    {
      escuelaId: 10,
      numeroTomo: 14,
      numeroFolio: 1,
      url: "escaneos/10/14/1.png",
      formato: "png",
      uploadedBy: 1,
    },
    {
      escuelaId: 10,
      numeroTomo: 12,
      numeroFolio: 1,
      url: "escaneos/10/12/1.png",
      formato: "png",
      uploadedBy: 1,
    },
    {
      escuelaId: 10,
      numeroTomo: 12,
      numeroFolio: 2,
      url: "escaneos/10/12/2.png",
      formato: "png",
      uploadedBy: 1,
    },
    {
      escuelaId: 20,
      numeroTomo: 12,
      numeroFolio: 1,
      url: "escaneos/20/12/1.png",
      formato: "png",
      uploadedBy: 1,
    },
  ]);
});

describe("listarResumenTomos", () => {
  it("devuelve los tomos de la escuela con conteo de folios, ordenados", async () => {
    const resumen = await listarResumenTomos(db, 10, { tipo: "pais" });

    expect(resumen).toEqual([
      { numeroTomo: 12, cantidadFolios: 2 },
      { numeroTomo: 14, cantidadFolios: 1 },
    ]);
  });

  it("respeta el ámbito y no mezcla tomos de otra escuela", async () => {
    const resumen = await listarResumenTomos(db, 10, {
      tipo: "escuela",
      escuelaId: 10,
    });
    expect(resumen.map((t) => t.numeroTomo)).toEqual([12, 14]);

    const ajeno = await listarResumenTomos(db, 10, {
      tipo: "escuela",
      escuelaId: 20,
    });
    expect(ajeno).toEqual([]);
  });
});
