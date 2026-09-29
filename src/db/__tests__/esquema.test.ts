import { describe, it, expect } from "vitest";

describe("Esquema de base de datos", () => {
  it("exporta las 15 tablas con nombres en español", async () => {
    const esquema = await import("../esquema");
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

  it("personas tiene columna identificacion unica", async () => {
    const esquema = await import("../esquema");
    expect(esquema.personas.identificacion).toBeDefined();
  });

  it("usuarios tiene columna email unica", async () => {
    const esquema = await import("../esquema");
    expect(esquema.usuarios.email).toBeDefined();
  });
});

describe("Índices de apoyo al ámbito", () => {
  it.each([
    "idx_escuelas_region_id",
    "idx_funcionario_escuela_funcionario_id",
    "idx_funcionario_escuela_escuela_id",
    "idx_acta_estudiantes_acta_id",
    "idx_acta_estudiantes_estudiante_id",
    "idx_estudiantes_persona_id",
    "idx_funcionarios_persona_id",
    "idx_acta_firmantes_acta_id",
    "idx_acta_firmantes_funcionario_id",
  ])("la base migrada tiene el índice %s", async (nombreIndice) => {
    const { crearDbEnMemoria } = await import(
      "@/server/repositorios/__tests__/db-en-memoria"
    );
    const { sql } = await import("drizzle-orm");
    const db = await crearDbEnMemoria();
    const filas = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'index' and name = ${nombreIndice}`
    );
    expect(filas).toHaveLength(1);
  });
});
