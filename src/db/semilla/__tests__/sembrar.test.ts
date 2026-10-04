/* eslint-disable security/detect-non-literal-fs-filename -- directorios temporales de la prueba */
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
import { ACTAS } from "../datos";
import type { GeneradorImagenEscaneo } from "../sembrar";
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

  it("siembra un escaneo por cada folio del rango de cada acta con la clave de la aplicación", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    await sembrarBaseDeDatos(db);

    const foliosEsperados = new Set(
      ACTAS.flatMap((acta) =>
        Array.from(
          { length: acta.folioFin - acta.folioInicio + 1 },
          (_, i) => `${acta.escuela}|${acta.numeroTomo}|${acta.folioInicio + i}`
        )
      )
    );
    const escaneos = await db.select().from(esquema.escaneos);
    const escuelas = await db.select().from(esquema.escuelas);

    expect(escaneos).toHaveLength(foliosEsperados.size);
    for (const escaneo of escaneos) {
      const codigo = escuelas.find((e) => e.id === escaneo.escuelaId)?.codigoMep;
      expect(foliosEsperados.has(`${codigo}|${escaneo.numeroTomo}|${escaneo.numeroFolio}`)).toBe(true);
      expect(escaneo.url).toBe(
        `escaneos/${escaneo.escuelaId}/${escaneo.numeroTomo}/${escaneo.numeroFolio}.png`
      );
      expect(escaneo.formato).toBe("png");
    }
    cliente.close();
  });

  it("migra las claves del formato anterior al volver a sembrar", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    await sembrarBaseDeDatos(db);
    const [escaneo] = await db.select().from(esquema.escaneos);
    await db
      .update(esquema.escaneos)
      .set({ url: "escaneos/001/tomo-1/folio-1.jpg", formato: "jpg" })
      .where(eq(esquema.escaneos.id, escaneo.id));

    await sembrarBaseDeDatos(db);
    const [actualizado] = await db
      .select()
      .from(esquema.escaneos)
      .where(eq(esquema.escaneos.id, escaneo.id));

    expect(actualizado.url).toBe(escaneo.url);
    expect(actualizado.formato).toBe("png");
    cliente.close();
  });

  it("pide una imagen por folio sembrado e informa cuántas generó", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    const solicitadas: string[] = [];
    const generarImagenEscaneo: GeneradorImagenEscaneo = async (datos) => {
      solicitadas.push(datos.clave);
      return true;
    };

    const resumen = await sembrarBaseDeDatos(db, { generarImagenEscaneo });
    const escaneos = await db.select().from(esquema.escaneos);

    expect(solicitadas.sort()).toEqual(escaneos.map((e) => e.url).sort());
    expect(resumen.imagenesGeneradas).toBe(escaneos.length);
    cliente.close();
  });

  it("no genera imágenes si no se inyecta un generador", async () => {
    const { cliente, db } = await abrirBaseMigrada();
    const resumen = await sembrarBaseDeDatos(db);
    expect(resumen.imagenesGeneradas).toBe(0);
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
  it("genera las imágenes en el directorio de almacenamiento y al reiniciar lo vacía", async () => {
    const directorio = fs.mkdtempSync(path.join(os.tmpdir(), "semilla-almacenamiento-"));
    try {
      const primera = await ejecutarSemillaLocal({
        urlBaseDeDatos: `file:${rutaDb}`,
        reiniciar: false,
        directorioAlmacenamiento: directorio,
        rondasHash: 4,
      });
      const clave = `escaneos/1/${ACTAS[0].numeroTomo}/1.png`;
      expect(primera.imagenesGeneradas).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(directorio, clave))).toBe(true);

      const segunda = await ejecutarSemillaLocal({
        urlBaseDeDatos: `file:${rutaDb}`,
        reiniciar: false,
        directorioAlmacenamiento: directorio,
        rondasHash: 4,
      });
      expect(segunda.imagenesGeneradas).toBe(0);

      fs.writeFileSync(path.join(directorio, "huerfano.txt"), "x");
      const tercera = await ejecutarSemillaLocal({
        urlBaseDeDatos: `file:${rutaDb}`,
        reiniciar: true,
        directorioAlmacenamiento: directorio,
        rondasHash: 4,
      });
      expect(fs.existsSync(path.join(directorio, "huerfano.txt"))).toBe(false);
      expect(tercera.imagenesGeneradas).toBe(primera.imagenesGeneradas);
    } finally {
      fs.rmSync(directorio, { recursive: true, force: true });
    }
  }, 30_000);

  it("rechaza una URL remota sin tocar nada", async () => {
    await expect(
      ejecutarSemillaLocal({ urlBaseDeDatos: "libsql://mi-base.turso.io", reiniciar: false })
    ).rejects.toThrow(/file:/);
  });

  it("siembra la base local y con reiniciar la recrea desde cero", async () => {
    const directorioAlmacenamiento = path.join(directorio, "almacenamiento");
    await ejecutarSemillaLocal({
      urlBaseDeDatos: `file:${rutaDb}`,
      reiniciar: false,
      directorioAlmacenamiento,
      rondasHash: 4,
    });

    const cliente = createClient({ url: `file:${rutaDb}` });
    const db = drizzle(cliente, { schema: esquema });
    await db.insert(esquema.regiones).values({ nombre: "Región Temporal" });
    cliente.close();

    await ejecutarSemillaLocal({
      urlBaseDeDatos: `file:${rutaDb}`,
      reiniciar: true,
      directorioAlmacenamiento,
      rondasHash: 4,
    });

    const clienteNuevo = createClient({ url: `file:${rutaDb}` });
    const dbNueva = drizzle(clienteNuevo, { schema: esquema });
    const regiones = await dbNueva.select().from(esquema.regiones);
    expect(regiones.map((r) => r.nombre)).not.toContain("Región Temporal");
    expect(regiones).toHaveLength(6);
    clienteNuevo.close();
  }, 30_000);
});
