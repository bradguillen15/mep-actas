import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, sql } from "drizzle-orm";
import { compare } from "bcryptjs";
import * as esquema from "../../esquema";
import { sembrarBaseDeDatos, PASSWORD_LOCAL } from "../sembrar";
import { migrarBaseDeDatos } from "../migrar";
import { resolverUrlLocal } from "../url-local";
import { ejecutarSemillaLocal } from "../local";
import { obtenerAmbitoDeFuncionario } from "../../../server/repositorios/usuarios.repositorio";

const TABLAS = [
  "roles",
  "regiones",
  "escuelas",
  "tipos_acta",
  "personas",
  "funcionarios",
  "funcionario_escuela",
  "usuarios",
  "actas",
  "estudiantes",
  "acta_estudiantes",
  "acta_firmantes",
  "escaneos",
  "acta_escaneos",
  "auditoria",
] as const;

let directorio: string;
let rutaDb: string;

async function contarFilas(db: ReturnType<typeof drizzle>) {
  const conteos = new Map<string, number>();
  for (const tabla of TABLAS) {
    const resultado = await db.all<{ total: number }>(
      sql.raw(`SELECT COUNT(*) AS total FROM ${tabla}`)
    );
    conteos.set(tabla, Number(resultado[0].total));
  }
  return conteos;
}

beforeEach(() => {
  directorio = fs.mkdtempSync(path.join(os.tmpdir(), "semilla-"));
  rutaDb = path.join(directorio, "prueba.db");
});

afterEach(() => {
  fs.rmSync(directorio, { recursive: true, force: true });
});

async function abrirBaseMigrada() {
  const cliente = createClient({ url: `file:${rutaDb}` });
  const db = drizzle(cliente, { schema: esquema });
  await migrarBaseDeDatos(db);
  return { cliente, db };
}

describe("sembrarBaseDeDatos", () => {
  it("es idempotente: ejecutarla dos veces deja los mismos conteos por tabla", async () => {
    const { cliente, db } = await abrirBaseMigrada();

    await sembrarBaseDeDatos(db);
    const primera = await contarFilas(db);
    await sembrarBaseDeDatos(db);
    const segunda = await contarFilas(db);

    expect(segunda).toEqual(primera);
    expect(primera.get("roles")).toBe(4);
    expect(primera.get("regiones")).toBe(6);
    expect(primera.get("tipos_acta")).toBe(4);
    expect(primera.get("actas")).toBeGreaterThan(0);
    expect(primera.get("acta_estudiantes")).toBeGreaterThan(0);
    expect(primera.get("acta_firmantes")).toBeGreaterThan(0);
    expect(primera.get("escaneos")).toBeGreaterThan(0);
    expect(primera.get("acta_escaneos")).toBeGreaterThan(0);
    cliente.close();
  });

  it("no vuelve a calcular el hash de usuarios existentes", async () => {
    const { cliente, db } = await abrirBaseMigrada();

    await sembrarBaseDeDatos(db);
    const [antes] = await db
      .select({ hash: esquema.usuarios.passwordHash })
      .from(esquema.usuarios)
      .where(eq(esquema.usuarios.email, "admin@pais.local"));
    await sembrarBaseDeDatos(db);
    const [despues] = await db
      .select({ hash: esquema.usuarios.passwordHash })
      .from(esquema.usuarios)
      .where(eq(esquema.usuarios.email, "admin@pais.local"));

    expect(despues.hash).toBe(antes.hash);
    expect(await compare(PASSWORD_LOCAL, antes.hash)).toBe(true);
    cliente.close();
  });

  it("crea usuarios de los 4 roles con un ámbito válido", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    await sembrarBaseDeDatos(db);

    const usuarios = await db
      .select({
        email: esquema.usuarios.email,
        funcionarioId: esquema.usuarios.funcionarioId,
        nivel: esquema.roles.nivel,
      })
      .from(esquema.usuarios)
      .innerJoin(esquema.roles, eq(esquema.usuarios.rolId, esquema.roles.id));

    for (const nivel of [1, 2, 3, 4]) {
      expect(usuarios.some((u) => u.nivel === nivel)).toBe(true);
    }

    for (const usuario of usuarios.filter((u) => u.nivel > 1)) {
      const ambito = await obtenerAmbitoDeFuncionario(db, usuario.funcionarioId);
      expect(ambito.escuelaIds.length, usuario.email).toBeGreaterThan(0);
      expect(ambito.regionIds.length, usuario.email).toBeGreaterThan(0);
    }
    cliente.close();
  });

  it("conserva los correos locales históricos", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    await sembrarBaseDeDatos(db);

    const correos = (await db.select({ email: esquema.usuarios.email }).from(esquema.usuarios)).map(
      (u) => u.email
    );
    expect(correos).toEqual(
      expect.arrayContaining([
        "admin@pais.local",
        "admin@regional.local",
        "admin@escuela.local",
        "staff@local",
      ])
    );
    cliente.close();
  });

  it("deja escuelas en al menos 3 regiones y actas en regiones distintas", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    await sembrarBaseDeDatos(db);

    const regionesConEscuelas = await db
      .selectDistinct({ regionId: esquema.escuelas.regionId })
      .from(esquema.escuelas);
    const regionesConActas = await db
      .selectDistinct({ regionId: esquema.escuelas.regionId })
      .from(esquema.actas)
      .innerJoin(esquema.escuelas, eq(esquema.actas.escuelaId, esquema.escuelas.id));

    expect(regionesConEscuelas.length).toBeGreaterThanOrEqual(3);
    expect(regionesConActas.length).toBeGreaterThanOrEqual(2);
    cliente.close();
  });

  it("devuelve un resumen con los usuarios sembrados por rol", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    const resumen = await sembrarBaseDeDatos(db);

    expect(resumen.usuarios.map((u) => u.nivel)).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    expect(resumen.usuarios.find((u) => u.email === "admin@pais.local")?.rol).toBe("Admin País");
    cliente.close();
  });
});

describe("resolverUrlLocal", () => {
  it("usa file:./mep-actas-local.db cuando no hay URL configurada", () => {
    expect(resolverUrlLocal(undefined)).toBe("file:./mep-actas-local.db");
  });

  it("acepta URLs file:", () => {
    expect(resolverUrlLocal("file:./otra.db")).toBe("file:./otra.db");
  });

  it("rechaza URLs que no sean file: para no sembrar Turso remoto", () => {
    expect(() => resolverUrlLocal("libsql://mi-base.turso.io")).toThrow(/file:/);
  });
});

describe("ejecutarSemillaLocal", () => {
  it("rechaza una URL remota sin tocar nada", async () => {
    await expect(
      ejecutarSemillaLocal({ urlBaseDeDatos: "libsql://mi-base.turso.io", reiniciar: false })
    ).rejects.toThrow(/file:/);
  });

  it("siembra la base local y con reiniciar la recrea desde cero", async () => {
    await ejecutarSemillaLocal({ urlBaseDeDatos: `file:${rutaDb}`, reiniciar: false });

    const cliente = createClient({ url: `file:${rutaDb}` });
    const db = drizzle(cliente, { schema: esquema });
    await db.insert(esquema.regiones).values({ nombre: "Región Temporal" });
    cliente.close();

    await ejecutarSemillaLocal({ urlBaseDeDatos: `file:${rutaDb}`, reiniciar: true });

    const clienteNuevo = createClient({ url: `file:${rutaDb}` });
    const dbNueva = drizzle(clienteNuevo, { schema: esquema });
    const regiones = await dbNueva.select().from(esquema.regiones);
    expect(regiones.map((r) => r.nombre)).not.toContain("Región Temporal");
    expect(regiones).toHaveLength(6);
    clienteNuevo.close();
  });
});
