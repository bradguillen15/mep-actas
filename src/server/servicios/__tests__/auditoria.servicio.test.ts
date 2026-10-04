import { describe, it, expect, vi } from "vitest";

describe("crearAuditor", () => {
  it("registra auditoria con timestamp", async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue(undefined);

    const mockDb = {
      insert: mockInsert,
      values: mockValues,
    };

    const { crearAuditor } = await import("../auditoria.servicio");
    const auditar = crearAuditor(mockDb as never);

    await auditar({
      usuarioId: 1,
      tabla: "actas",
      registroId: 10,
      accion: "crear",
      datosAnteriores: null,
      datosNuevos: JSON.stringify({ titulo: "Acta 2025" }),
    });

    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("crearAuditor con ámbito (SQLite en memoria)", () => {
  async function prepararDb() {
    const { crearDbEnMemoria } = await import("@/server/repositorios/__tests__/db-en-memoria");
    const { sembrarEscenarioDeAmbito } = await import("@/server/repositorios/__tests__/datos-ambito");
    const esquema = await import("@/db/esquema");
    const db = await crearDbEnMemoria();
    await sembrarEscenarioDeAmbito(db);
    await db.insert(esquema.roles).values({ id: 1, nombre: "Admin País", nivel: 1 });
    await db.insert(esquema.usuarios).values({
      id: 1, funcionarioId: 6, rolId: 1, email: "pais@e2e.test", passwordHash: "h",
    });
    return { db, esquema };
  }

  const base = { usuarioId: 1, tabla: "actas", registroId: 1, accion: "crear", datosAnteriores: null, datosNuevos: null };

  it("deriva la región desde la escuela cuando no se informa", async () => {
    const { db, esquema } = await prepararDb();
    const { crearAuditor } = await import("../auditoria.servicio");
    await crearAuditor(db)({ ...base, escuelaId: 20 });
    const [fila] = await db.select().from(esquema.auditoria);
    expect(fila).toMatchObject({ escuelaId: 20, regionId: 2 });
  });

  it("registra un recurso regional sin escuela", async () => {
    const { db, esquema } = await prepararDb();
    const { crearAuditor } = await import("../auditoria.servicio");
    await crearAuditor(db)({ ...base, tabla: "regiones", regionId: 1 });
    const [fila] = await db.select().from(esquema.auditoria);
    expect(fila).toMatchObject({ escuelaId: null, regionId: 1 });
  });

  it("registra un recurso nacional sin escuela ni región", async () => {
    const { db, esquema } = await prepararDb();
    const { crearAuditor } = await import("../auditoria.servicio");
    await crearAuditor(db)({ ...base, tabla: "tipos_acta" });
    const [fila] = await db.select().from(esquema.auditoria);
    expect(fila).toMatchObject({ escuelaId: null, regionId: null });
  });
});
