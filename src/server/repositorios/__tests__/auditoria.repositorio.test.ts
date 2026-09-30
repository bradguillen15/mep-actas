import { describe, it, expect, vi } from "vitest";

describe("insertarRegistroAuditoria", () => {
  it("llama a db.insert con los datos correctos", async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue(undefined);

    const mockDb = {
      insert: mockInsert,
      values: mockValues,
    };

    const { insertarRegistroAuditoria } = await import(
      "../auditoria.repositorio"
    );

    await insertarRegistroAuditoria(mockDb as never, {
      usuarioId: 1,
      tabla: "actas",
      registroId: 10,
      accion: "crear",
      datosAnteriores: null,
      datosNuevos: JSON.stringify({ titulo: "Acta 2025" }),
      escuelaId: null,
      regionId: null,
      createdAt: new Date().toISOString(),
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("auditoría con ámbito (SQLite en memoria)", () => {
  async function prepararDb() {
    const { crearDbEnMemoria } = await import("./db-en-memoria");
    const { sembrarEscenarioDeAmbito } = await import("./datos-ambito");
    const esquema = await import("@/db/esquema");
    const db = await crearDbEnMemoria();
    await sembrarEscenarioDeAmbito(db);
    await db.insert(esquema.roles).values({ id: 1, nombre: "Admin País", nivel: 1 });
    await db.insert(esquema.usuarios).values({
      id: 1, funcionarioId: 6, rolId: 1, email: "pais@e2e.test", passwordHash: "h",
    });
    const { insertarRegistroAuditoria } = await import("../auditoria.repositorio");
    const base = {
      usuarioId: 1, accion: "actualizar", datosAnteriores: null, datosNuevos: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    await insertarRegistroAuditoria(db, { ...base, tabla: "actas", registroId: 10, escuelaId: 10, regionId: 1 });
    await insertarRegistroAuditoria(db, { ...base, tabla: "actas", registroId: 20, escuelaId: 20, regionId: 2 });
    await insertarRegistroAuditoria(db, { ...base, tabla: "regiones", registroId: 1, escuelaId: null, regionId: 1 });
    await insertarRegistroAuditoria(db, { ...base, tabla: "tipos_acta", registroId: 1, escuelaId: null, regionId: null });
    return db;
  }

  async function registrosVisibles(ambito: Parameters<typeof import("../auditoria.repositorio").listarAuditoria>[2]) {
    const db = await prepararDb();
    const { listarAuditoria } = await import("../auditoria.repositorio");
    const filas = await listarAuditoria(db, {}, ambito);
    return filas.map((fila) => `${fila.tabla}:${fila.registroId}`).sort();
  }

  it("el país ve todo, incluidos los registros nacionales", async () => {
    expect(await registrosVisibles({ tipo: "pais" })).toEqual([
      "actas:10", "actas:20", "regiones:1", "tipos_acta:1",
    ]);
  });

  it("la región ve su región, incluidos los registros regionales sin escuela", async () => {
    expect(await registrosVisibles({ tipo: "region", regionId: 1 })).toEqual([
      "actas:10", "regiones:1",
    ]);
  });

  it("la escuela ve solo su escuela y no los registros regionales", async () => {
    expect(await registrosVisibles({ tipo: "escuela", escuelaId: 10 })).toEqual(["actas:10"]);
  });

  it("el ámbito ninguno no ve nada", async () => {
    expect(await registrosVisibles({ tipo: "ninguno" })).toEqual([]);
  });
});
