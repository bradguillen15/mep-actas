import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearServicioAuditoria } from "@/server/servicios/auditoria.vistas.servicio";
import * as repositorio from "@/server/repositorios/auditoria.repositorio";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;
});

describe("Auditoria e2e", () => {
  it("lista registros de auditoria", async () => {
    const servicio = crearServicioAuditoria({
      listarAuditoria: (filtros) => repositorio.listarAuditoria(db, filtros),
    });

    const registros = await servicio.listar({ limite: 10 });
    expect(Array.isArray(registros)).toBe(true);
  });

  it("filtra por tabla", async () => {
    const servicio = crearServicioAuditoria({
      listarAuditoria: (filtros) => repositorio.listarAuditoria(db, filtros),
    });

    const registros = await servicio.listar({ tabla: "regiones" });
    expect(Array.isArray(registros)).toBe(true);
  });

  it("filtra por accion", async () => {
    const servicio = crearServicioAuditoria({
      listarAuditoria: (filtros) => repositorio.listarAuditoria(db, filtros),
    });

    const registros = await servicio.listar({ accion: "crear" });
    expect(Array.isArray(registros)).toBe(true);
  });

  it("incluye email del usuario en los resultados", async () => {
    const servicio = crearServicioAuditoria({
      listarAuditoria: (filtros) => repositorio.listarAuditoria(db, filtros),
    });

    const registros = await servicio.listar({ limite: 5 });
    for (const r of registros) {
      expect(r.usuarioEmail).toBeDefined();
      expect(typeof r.usuarioEmail).toBe("string");
    }
  });
});
