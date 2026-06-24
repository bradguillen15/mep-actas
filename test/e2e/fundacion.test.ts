import { describe, it, expect, beforeAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import * as esquema from "@/db/esquema";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { obtenerUsuarioPorEmail } from "./helpers";
import { eq } from "drizzle-orm";

let usuarioAdminPaisId: number;

beforeAll(async () => {
  const db = clienteDb();
  const usuario = await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test");
  usuarioAdminPaisId = usuario.id;
});

describe("Fundación — esquema y cliente", () => {
  it("clienteDb retorna una instancia válida", () => {
    const db = clienteDb();
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
  });

  it("las tablas existen en la base de datos", async () => {
    const db = clienteDb();
    const resultado: (typeof esquema.regiones.$inferSelect)[] =
      await db.select().from(esquema.regiones);
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("los roles están seedeados", async () => {
    const db = clienteDb();
    const roles: (typeof esquema.roles.$inferSelect)[] = await db
      .select()
      .from(esquema.roles);

    expect(roles).toHaveLength(4);
    expect(roles.map((r) => r.nombre)).toContain("Admin País");
  });
});

describe("Fundación — auditoría", () => {
  it("crearAuditor inserta un registro en la tabla auditoria", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);

    await auditor({
      usuarioId: usuarioAdminPaisId,
      tabla: "test_e2e",
      registroId: 999,
      accion: "test",
      datosAnteriores: null,
      datosNuevos: JSON.stringify({ prueba: true }),
    });

    const registros: (typeof esquema.auditoria.$inferSelect)[] = await db
      .select()
      .from(esquema.auditoria)
      .where(eq(esquema.auditoria.tabla, "test_e2e"));

    expect(registros.length).toBeGreaterThanOrEqual(1);
    const registro = registros.find((r) => r.registroId === 999);
    expect(registro).toBeDefined();
    expect(registro!.accion).toBe("test");

    await db
      .delete(esquema.auditoria)
      .where(eq(esquema.auditoria.tabla, "test_e2e"));
  });
});
