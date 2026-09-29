import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearServicioGraduacionesDesdeDb } from "@/server/servicios/graduaciones.fabrica";
import { LIMITE_GRADUACIONES_POR_PAGINA } from "@/lib/graduaciones";

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
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const resultados = await servicio.buscar({
      identificacion: "999999999",
    }, { tipo: "pais" });

    expect(resultados.datos.length).toBeGreaterThanOrEqual(1);
    expect(resultados.datos[0].identificacion).toBe("999999999");
    expect(resultados.datos[0].nombreCompleto).toBe("Graduado Test Consulta E2E");
    expect(resultados.datos[0].numeroCertificado).toBe(5001);
  });

  it("busca por identificacion parcial", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const resultados = await servicio.buscar({
      identificacion: "99999",
    }, { tipo: "pais" });

    expect(resultados.datos.length).toBeGreaterThanOrEqual(1);
    expect(resultados.datos[0].identificacion).toBe("999999999");
  });

  it("busca por nombre parcial", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const resultados = await servicio.buscar({
      nombre: "Graduado",
    }, { tipo: "pais" });

    expect(resultados.datos.length).toBeGreaterThanOrEqual(1);
  });

  it("retorna vacio si no hay coincidencias", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const resultados = await servicio.buscar({
      identificacion: "000000000",
    }, { tipo: "pais" });

    expect(resultados.datos).toHaveLength(0);
    expect(resultados.total).toBe(0);
  });

  it("lista graduaciones recientes cuando no hay criterio de busqueda", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const resultados = await servicio.buscar({}, { tipo: "pais" });
    expect(resultados.datos.length).toBeGreaterThanOrEqual(1);
    expect(resultados.datos[0].nombreCompleto).toBeTruthy();
    expect(resultados.datos[0].fecha).toBeTruthy();
    expect(resultados.total).toBeGreaterThanOrEqual(1);
    expect(resultados.pagina).toBe(1);
    expect(resultados.limite).toBe(LIMITE_GRADUACIONES_POR_PAGINA);
  });

  it("pagina resultados cuando hay mas registros que el limite", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const primeraPagina = await servicio.buscar({
      pagina: 1,
      limite: 1,
    }, { tipo: "pais" });
    const segundaPagina = await servicio.buscar({
      pagina: 2,
      limite: 1,
    }, { tipo: "pais" });

    expect(primeraPagina.datos).toHaveLength(1);
    expect(primeraPagina.pagina).toBe(1);
    expect(primeraPagina.limite).toBe(1);
    expect(primeraPagina.total).toBeGreaterThanOrEqual(1);

    if (primeraPagina.total > 1) {
      expect(segundaPagina.datos).toHaveLength(1);
      expect(segundaPagina.datos[0].id).not.toBe(primeraPagina.datos[0].id);
    }
  });

  it("obtiene detalle por id", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    const detalle = await servicio.obtenerPorId(idsActa[0], { tipo: "pais" });
    expect(detalle.acta.length).toBeGreaterThanOrEqual(1);
    expect(detalle.acta[0].tituloActa).toBe("Acta de Graduación 2026");
  });

  it("lanza NotFoundError si id no existe", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);

    await expect(servicio.obtenerPorId(99999, { tipo: "pais" })).rejects.toThrow(
      "Graduación no encontrada"
    );
  });
});
