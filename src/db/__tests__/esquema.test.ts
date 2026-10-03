import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import * as esquema from "../esquema";
import { crearDbEnMemoria } from "@/server/repositorios/__tests__/db-en-memoria";

describe("Esquema de base de datos", () => {
  it("exporta las 15 tablas con nombres en español", async () => {
    const tablas = [
      "regiones",
      "escuelas",
      "tiposActas",
      "actas",
      "actaEstudiantes",
      "personas",
      "estudiantes",
      "escaneos",
      "actaEscaneos",
      "funcionarios",
      "funcionarioEscuela",
      "actaFirmantes",
      "roles",
      "usuarios",
      "auditoria",
    ];

    for (const tabla of tablas) {
      expect(esquema).toHaveProperty(tabla);
    }
  });

  it("personas tiene columna identificacion unica", () => {
    expect(esquema.personas.identificacion).toBeDefined();
  });

  it("usuarios tiene columna email unica", () => {
    expect(esquema.usuarios.email).toBeDefined();
  });

  it("no exporta el objeto muerto indices", () => {
    expect(esquema).not.toHaveProperty("indices");
  });
});

describe("Índices de apoyo al ámbito", () => {
  it.each([
    "idx_escuelas_region_id",
    "idx_funcionario_escuela_funcionario_id",
    "idx_funcionario_escuela_escuela_id",
    "idx_acta_estudiantes_acta_id",
    "idx_acta_estudiantes_estudiante_id",
    "idx_acta_firmantes_acta_id",
    "idx_acta_firmantes_funcionario_id",
  ])("la base migrada tiene el índice %s", async (nombreIndice) => {
    const db = await crearDbEnMemoria();
    const filas = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index' and name = ${nombreIndice}`
    );
    expect(filas).toHaveLength(1);
  });

  it("no conserva el índice redundante de identificación de personas", async () => {
    const db = await crearDbEnMemoria();
    const filas = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index' and name = 'idx_personas_identificacion'`
    );
    expect(filas).toHaveLength(0);
  });
});

describe("Auditoría con ámbito", () => {
  it("auditoria tiene escuela_id y region_id opcionales", () => {
    expect(esquema.auditoria.escuelaId.notNull).toBe(false);
    expect(esquema.auditoria.regionId.notNull).toBe(false);
  });

  it.each(["idx_auditoria_escuela_id", "idx_auditoria_region_id"])(
    "la base migrada tiene el índice %s",
    async (nombreIndice) => {
      const db = await crearDbEnMemoria();
      const filas = await db.all<{ name: string }>(
        sql`select name from sqlite_master where type = 'index' and name = ${nombreIndice}`
      );
      expect(filas).toHaveLength(1);
    }
  );
});

describe("Integridad del esquema", () => {
  async function sembrarMinimo() {
    const db = await crearDbEnMemoria();
    await db.insert(esquema.regiones).values({ id: 1, nombre: "Central" });
    await db.insert(esquema.escuelas).values({
      id: 1,
      regionId: 1,
      codigoMep: "MEP-001",
      nombre: "Escuela Central",
    });
    await db.insert(esquema.tiposActas).values({ id: 1, nombre: "Graduación" });
    await db.insert(esquema.roles).values({ id: 4, nombre: "Staff", nivel: 4 });
    await db.insert(esquema.personas).values({
      id: 1,
      identificacion: "1-1111-1111",
      nombres: "Ana",
      apellidos: "Pérez",
    });
    await db.insert(esquema.funcionarios).values({
      id: 1,
      personaId: 1,
      puesto: "Docente",
    });
    await db.insert(esquema.usuarios).values({
      id: 1,
      funcionarioId: 1,
      rolId: 4,
      email: "ana@mep.go.cr",
      passwordHash: "hash",
    });
    return db;
  }

  async function esperarRechazoPorRestriccion(
    promesa: Promise<unknown>,
    patron: RegExp
  ) {
    try {
      await promesa;
      expect.unreachable("debía rechazar por restricción SQL");
    } catch (error) {
      const texto = [
        error instanceof Error ? error.message : String(error),
        error instanceof Error && error.cause instanceof Error
          ? error.cause.message
          : "",
        error instanceof Error && error.cause
          ? String(error.cause)
          : "",
      ].join("\n");
      expect(texto).toMatch(patron);
    }
  }

  it.each([
    "escuelas_codigo_mep_unique",
    "uq_escaneos_escuela_tomo_folio",
    "uq_acta_estudiantes_acta_estudiante",
    "uq_acta_escaneos_acta_escaneo",
    "uq_funcionario_escuela_par",
    "uq_acta_firmantes_acta_funcionario_rol",
    "estudiantes_persona_id_unique",
    "funcionarios_persona_id_unique",
    "usuarios_funcionario_id_unique",
    "regiones_nombre_unique",
    "tipos_acta_nombre_unique",
    "roles_nombre_unique",
    "roles_nivel_unique",
  ])("la base migrada tiene el índice único %s", async (nombreIndice) => {
    const db = await crearDbEnMemoria();
    const filas = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index' and name = ${nombreIndice}`
    );
    expect(filas).toHaveLength(1);
  });

  it("activa PRAGMA foreign_keys", async () => {
    const db = await crearDbEnMemoria();
    const filas = await db.all<{ foreign_keys: number }>(
      sql`pragma foreign_keys`
    );
    expect(filas[0]?.foreign_keys).toBe(1);
  });

  it("rechaza codigo_mep duplicado", async () => {
    const db = await sembrarMinimo();
    await esperarRechazoPorRestriccion(
      db.insert(esquema.escuelas).values({
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Otra",
      }),
      /UNIQUE/i
    );
  });

  it("rechaza escaneo duplicado por escuela+tomo+folio", async () => {
    const db = await sembrarMinimo();
    await db.insert(esquema.escaneos).values({
      escuelaId: 1,
      numeroTomo: 1,
      numeroFolio: 1,
      url: "a.jpg",
      formato: "jpg",
      uploadedBy: 1,
    });
    await esperarRechazoPorRestriccion(
      db.insert(esquema.escaneos).values({
        escuelaId: 1,
        numeroTomo: 1,
        numeroFolio: 1,
        url: "b.jpg",
        formato: "jpg",
        uploadedBy: 1,
      }),
      /UNIQUE/i
    );
  });

  it("rechaza acta_referencia_id inexistente", async () => {
    const db = await sembrarMinimo();
    await esperarRechazoPorRestriccion(
      db.insert(esquema.actas).values({
        escuelaId: 1,
        tipoActaId: 1,
        actaReferenciaId: 999,
        titulo: "Corrección",
        numeroTomo: 1,
        folioInicio: 1,
        folioFin: 2,
        fecha: "2026-01-01",
      }),
      /FOREIGN KEY/i
    );
  });

  it("rechaza folio_fin menor que folio_inicio", async () => {
    const db = await sembrarMinimo();
    await esperarRechazoPorRestriccion(
      db.insert(esquema.actas).values({
        escuelaId: 1,
        tipoActaId: 1,
        titulo: "Inválida",
        numeroTomo: 1,
        folioInicio: 5,
        folioFin: 2,
        fecha: "2026-01-01",
      }),
      /CHECK/i
    );
  });

  it("rechaza roles.nivel fuera de 1 a 4", async () => {
    const db = await crearDbEnMemoria();
    await esperarRechazoPorRestriccion(
      db.insert(esquema.roles).values({ nombre: "Inválido", nivel: 5 }),
      /CHECK/i
    );
  });
});
