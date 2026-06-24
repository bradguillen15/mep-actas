import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioActas } from "@/server/servicios/actas.servicio";
import * as actasRepositorio from "@/server/repositorios/actas.repositorio";
import * as detalleRepositorio from "@/server/repositorios/actas.detalle.repositorio";
import {
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  datosSesionAdminEscuela,
} from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
const idsActa: number[] = [];

let sesionAdminEscuela: ReturnType<typeof datosSesionAdminEscuela>;
let tipoActaId: number;
let personaId: number;
let escuelaId: number;

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  const rolAdminEscuela = await obtenerRolPorNivel(db, 3);
  const usuarioAdminEscuela = await obtenerUsuarioPorEmail(
    db,
    "admin-escuela@e2e.test"
  );

  const [{ id: regionId }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región Test Actas", activo: true })
    .returning()
    .all();
  idsRegion.push(regionId);

  const [{ id: escId }] = await db
    .insert(esquema.escuelas)
    .values({ nombre: "Escuela Test Actas", regionId, codigoMep: "ACTAS-TEST-001", activo: true })
    .returning()
    .all();
  idsEscuela.push(escId);
  escuelaId = escId;

  sesionAdminEscuela = datosSesionAdminEscuela(
    usuarioAdminEscuela.id,
    rolAdminEscuela.id,
    escId
  );

  const [tipo] = await db
    .select()
    .from(esquema.tiposActas)
    .limit(1);
  tipoActaId = tipo.id;

  const [persona] = await db
    .insert(esquema.personas)
    .values({ identificacion: "123456789", nombres: "Estudiante Test", apellidos: "Actas E2E" })
    .returning()
    .all();
  personaId = persona.id;
});

afterAll(async () => {
  for (const id of idsActa) {
    await db
      .delete(esquema.actaEstudiantes)
      .where(eq(esquema.actaEstudiantes.actaId, id));
    await db
      .delete(esquema.actaFirmantes)
      .where(eq(esquema.actaFirmantes.actaId, id));
    await db.delete(esquema.actas).where(eq(esquema.actas.id, id));
  }
  for (const id of idsEscuela) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegion) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Actas e2e", () => {
  it("crea acta via servicio", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioActas(
      {
        listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
        obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
        crearActa: (datos) => actasRepositorio.crearActa(db, datos),
        actualizarActa: (id, datos) =>
          actasRepositorio.actualizarActa(db, id, datos),
      },
      {
        listarEstudiantesDeActa: (actaId) =>
          detalleRepositorio.listarEstudiantesDeActa(db, actaId),
        agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
          detalleRepositorio.agregarEstudianteAActa(
            db,
            actaId,
            personaId,
            numeroCertificado
          ),
        listarFirmantesDeActa: (actaId) =>
          detalleRepositorio.listarFirmantesDeActa(db, actaId),
        agregarFirmante: (actaId, funcionarioId, rolFirma) =>
          detalleRepositorio.agregarFirmante(
            db,
            actaId,
            funcionarioId,
            rolFirma
          ),
      },
      auditor
    );

    const acta = await servicio.crearActa(
      {
        escuelaId,
        tipoActaId,
        titulo: "Acta de Graduación Test",
        numeroTomo: 1,
        folioInicio: 1,
        folioFin: 10,
        fecha: new Date().toISOString(),
      },
      sesionAdminEscuela
    );

    expect(acta).toBeDefined();
    expect(acta.id).toBeGreaterThan(0);
    expect(acta.titulo).toBe("Acta de Graduación Test");
    expect(acta.numeroTomo).toBe(1);
    expect(acta.folioInicio).toBe(1);
    expect(acta.folioFin).toBe(10);

    idsActa.push(acta.id);
  });

  it("lista actas por escuela", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioActas(
      {
        listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
        obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
        crearActa: (datos) => actasRepositorio.crearActa(db, datos),
        actualizarActa: (id, datos) =>
          actasRepositorio.actualizarActa(db, id, datos),
      },
      {
        listarEstudiantesDeActa: (actaId) =>
          detalleRepositorio.listarEstudiantesDeActa(db, actaId),
        agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
          detalleRepositorio.agregarEstudianteAActa(
            db,
            actaId,
            personaId,
            numeroCertificado
          ),
        listarFirmantesDeActa: (actaId) =>
          detalleRepositorio.listarFirmantesDeActa(db, actaId),
        agregarFirmante: (actaId, funcionarioId, rolFirma) =>
          detalleRepositorio.agregarFirmante(
            db,
            actaId,
            funcionarioId,
            rolFirma
          ),
      },
      auditor
    );

    const actas = await servicio.listarActas({ escuelaId });
    expect(actas.length).toBeGreaterThanOrEqual(1);
  });

  it("obtiene acta con detalle completo", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioActas(
      {
        listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
        obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
        crearActa: (datos) => actasRepositorio.crearActa(db, datos),
        actualizarActa: (id, datos) =>
          actasRepositorio.actualizarActa(db, id, datos),
      },
      {
        listarEstudiantesDeActa: (actaId) =>
          detalleRepositorio.listarEstudiantesDeActa(db, actaId),
        agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
          detalleRepositorio.agregarEstudianteAActa(
            db,
            actaId,
            personaId,
            numeroCertificado
          ),
        listarFirmantesDeActa: (actaId) =>
          detalleRepositorio.listarFirmantesDeActa(db, actaId),
        agregarFirmante: (actaId, funcionarioId, rolFirma) =>
          detalleRepositorio.agregarFirmante(
            db,
            actaId,
            funcionarioId,
            rolFirma
          ),
      },
      auditor
    );

    const actaId = idsActa[0];
    const detalle = await servicio.obtenerActaPorId(actaId);

    expect(detalle.acta).toBeDefined();
    expect(detalle.acta.id).toBe(actaId);
    expect(Array.isArray(detalle.estudiantes)).toBe(true);
    expect(Array.isArray(detalle.firmantes)).toBe(true);
  });

  it("agrega estudiante a acta", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioActas(
      {
        listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
        obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
        crearActa: (datos) => actasRepositorio.crearActa(db, datos),
        actualizarActa: (id, datos) =>
          actasRepositorio.actualizarActa(db, id, datos),
      },
      {
        listarEstudiantesDeActa: (actaId) =>
          detalleRepositorio.listarEstudiantesDeActa(db, actaId),
        agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
          detalleRepositorio.agregarEstudianteAActa(
            db,
            actaId,
            personaId,
            numeroCertificado
          ),
        listarFirmantesDeActa: (actaId) =>
          detalleRepositorio.listarFirmantesDeActa(db, actaId),
        agregarFirmante: (actaId, funcionarioId, rolFirma) =>
          detalleRepositorio.agregarFirmante(
            db,
            actaId,
            funcionarioId,
            rolFirma
          ),
      },
      auditor
    );

    const actaId = idsActa[0];
    const resultado = await servicio.agregarEstudiante(
      actaId,
      personaId,
      1001,
      sesionAdminEscuela
    );

    expect(resultado).toBeDefined();
    expect(resultado.actaId).toBe(actaId);
    expect(resultado.numeroCertificado).toBe(1001);
  });

  it("lanza NotFoundError si acta no existe", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioActas(
      {
        listarActas: (filtros) => actasRepositorio.listarActas(db, filtros),
        obtenerActaPorId: (id) => actasRepositorio.obtenerActaPorId(db, id),
        crearActa: (datos) => actasRepositorio.crearActa(db, datos),
        actualizarActa: (id, datos) =>
          actasRepositorio.actualizarActa(db, id, datos),
      },
      {
        listarEstudiantesDeActa: (actaId) =>
          detalleRepositorio.listarEstudiantesDeActa(db, actaId),
        agregarEstudianteAActa: (actaId, personaId, numeroCertificado) =>
          detalleRepositorio.agregarEstudianteAActa(
            db,
            actaId,
            personaId,
            numeroCertificado
          ),
        listarFirmantesDeActa: (actaId) =>
          detalleRepositorio.listarFirmantesDeActa(db, actaId),
        agregarFirmante: (actaId, funcionarioId, rolFirma) =>
          detalleRepositorio.agregarFirmante(
            db,
            actaId,
            funcionarioId,
            rolFirma
          ),
      },
      auditor
    );

    await expect(
      servicio.obtenerActaPorId(99999)
    ).rejects.toThrow("Acta no encontrada");
  });
});
