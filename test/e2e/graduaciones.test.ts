import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearServicioGraduaciones } from "@/server/servicios/graduaciones.servicio";
import * as repositorio from "@/server/repositorios/graduaciones.repositorio";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
const idsActa: number[] = [];
const idsPersona: number[] = [];

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  const [{ id: regionId }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región Test Grad", activo: true })
    .returning()
    .all();
  idsRegion.push(regionId);

  const [{ id: escuelaId }] = await db
    .insert(esquema.escuelas)
    .values({ nombre: "Escuela Test Grad", regionId, codigoMep: "GRAD-001", activo: true })
    .returning()
    .all();
  idsEscuela.push(escuelaId);

  const [tipoActa] = await db
    .select()
    .from(esquema.tiposActas)
    .limit(1);

  const [{ id: personaId }] = await db
    .insert(esquema.personas)
    .values({ identificacion: "999999999", nombres: "Graduado Test", apellidos: "Consulta E2E" })
    .returning()
    .all();
  idsPersona.push(personaId);

  const [{ id: actaId }] = await db
    .insert(esquema.actas)
    .values({
      escuelaId,
      tipoActaId: tipoActa.id,
      titulo: "Acta de Graduación 2026",
      numeroTomo: 1,
      folioInicio: 1,
      folioFin: 5,
      fecha: new Date().toISOString(),
    })
    .returning()
    .all();
  idsActa.push(actaId);

  const [{ id: estudianteId }] = await db
    .insert(esquema.estudiantes)
    .values({ personaId })
    .returning()
    .all();

  await db
    .insert(esquema.actaEstudiantes)
    .values({ actaId, estudianteId, numeroCertificado: 5001 })
    .run();
});

afterAll(async () => {
  for (const id of idsActa) {
    await db
      .delete(esquema.actaEstudiantes)
      .where(eq(esquema.actaEstudiantes.actaId, id));
    await db.delete(esquema.actas).where(eq(esquema.actas.id, id));
  }
  for (const id of idsEscuela) {
    await db
      .delete(esquema.escuelas)
      .where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegion) {
    await db
      .delete(esquema.regiones)
      .where(eq(esquema.regiones.id, id));
  }
});

describe("Consulta graduaciones e2e", () => {
  it("busca por identificacion exacta", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    const resultados = await servicio.buscar({
      identificacion: "999999999",
    });

    expect(resultados.length).toBeGreaterThanOrEqual(1);
    expect(resultados[0].identificacion).toBe("999999999");
    expect(resultados[0].nombres).toBe("Graduado Test");
    expect(resultados[0].numeroCertificado).toBe(5001);
  });

  it("busca por nombre parcial", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    const resultados = await servicio.buscar({
      nombre: "Graduado",
    });

    expect(resultados.length).toBeGreaterThanOrEqual(1);
  });

  it("retorna vacio si no hay coincidencias", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    const resultados = await servicio.buscar({
      identificacion: "000000000",
    });

    expect(resultados).toHaveLength(0);
  });

  it("retorna vacio si no se especifica criterio de busqueda", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    const resultados = await servicio.buscar({});
    expect(resultados).toHaveLength(0);
  });

  it("obtiene detalle por id", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    const detalle = await servicio.obtenerPorId(idsActa[0]);
    expect(detalle.acta.length).toBeGreaterThanOrEqual(1);
    expect(detalle.acta[0].titulo).toBe("Acta de Graduación 2026");
  });

  it("lanza NotFoundError si id no existe", async () => {
    const servicio = crearServicioGraduaciones({
      buscarGraduaciones: (params) =>
        repositorio.buscarGraduaciones(db, params),
      obtenerGraduacionPorId: (id) =>
        repositorio.obtenerGraduacionPorId(db, id),
    });

    await expect(servicio.obtenerPorId(99999)).rejects.toThrow(
      "Graduación no encontrada"
    );
  });
});
