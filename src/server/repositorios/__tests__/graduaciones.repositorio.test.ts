import { describe, it, expect, beforeAll } from "vitest";
import * as esquema from "@/db/esquema";
import type { AmbitoConsulta } from "@/server/auth/ambito";
import {
  buscarGraduaciones,
  obtenerGraduacionPorId,
} from "../graduaciones.repositorio";
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
    { id: 11, regionId: 1, codigoMep: "E11", nombre: "Escuela 11" },
    { id: 20, regionId: 2, codigoMep: "E20", nombre: "Escuela 20" },
  ]);
  await db.insert(esquema.tiposActas).values({ id: 1, nombre: "Bachillerato" });
  await db.insert(esquema.actas).values(
    [10, 11, 20].map((escuelaId) => ({
      id: escuelaId,
      escuelaId,
      tipoActaId: 1,
      titulo: `Acta ${escuelaId}`,
      numeroTomo: 1,
      folioInicio: 1,
      folioFin: 2,
      fecha: "2025-12-01",
    }))
  );
  await db.insert(esquema.personas).values(
    [10, 11, 20].map((escuelaId) => ({
      id: escuelaId,
      identificacion: `1000000${escuelaId}`,
      nombres: "Ana",
      apellidos: `Mora ${escuelaId}`,
    }))
  );
  await db
    .insert(esquema.estudiantes)
    .values([10, 11, 20].map((id) => ({ id, personaId: id })));
  await db.insert(esquema.actaEstudiantes).values(
    [10, 11, 20].map((id) => ({ actaId: id, estudianteId: id, numeroCertificado: id }))
  );
});

async function escuelasEncontradas(ambito: AmbitoConsulta) {
  const resultado = await buscarGraduaciones(db, { nombre: "mora" }, ambito);
  return {
    escuelas: resultado.datos.map((fila) => fila.escuelaId).sort(),
    total: resultado.total,
  };
}

describe("buscarGraduaciones con ámbito", () => {
  it("el país ve todas las escuelas", async () => {
    expect(await escuelasEncontradas({ tipo: "pais" })).toEqual({
      escuelas: [10, 11, 20],
      total: 3,
    });
  });

  it("la región ve solo sus escuelas y el total coincide", async () => {
    expect(await escuelasEncontradas({ tipo: "region", regionId: 1 })).toEqual({
      escuelas: [10, 11],
      total: 2,
    });
  });

  it("la escuela ve solo sus graduaciones", async () => {
    expect(await escuelasEncontradas({ tipo: "escuela", escuelaId: 20 })).toEqual({
      escuelas: [20],
      total: 1,
    });
  });

  it("una identificación de otra escuela no aparece en la búsqueda", async () => {
    const resultado = await buscarGraduaciones(
      db,
      { identificacion: "100000020" },
      { tipo: "escuela", escuelaId: 10 }
    );
    expect(resultado).toMatchObject({ datos: [], total: 0 });
  });
});

describe("obtenerGraduacionPorId con ámbito", () => {
  it("devuelve el acta dentro del ámbito", async () => {
    const filas = await obtenerGraduacionPorId(db, 20, { tipo: "region", regionId: 2 });
    expect(filas).toHaveLength(1);
  });

  it("no devuelve un acta fuera del ámbito", async () => {
    const filas = await obtenerGraduacionPorId(db, 20, { tipo: "escuela", escuelaId: 10 });
    expect(filas).toEqual([]);
  });
});
