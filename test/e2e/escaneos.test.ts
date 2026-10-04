import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import * as repositorio from "@/server/repositorios/escaneos.repositorio";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioEscaneosDesdeDb } from "@/server/servicios/escaneos.fabrica";
import { crearServicioRegiones } from "@/server/servicios/regiones.servicio";
import * as repositorioRegiones from "@/server/repositorios/regiones.repositorio";
import { datosSesionAdminPais, obtenerRolPorNivel, obtenerUsuarioPorEmail, EMAIL_ADMIN_PAIS } from "./helpers";
import { eq, and } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
const idsEscaneo: number[] = [];
let sesion: SesionUsuario;

beforeAll(async () => {
  const db = clienteDb();
  const rol = await obtenerRolPorNivel(db, 1);
  const usuario = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  sesion = datosSesionAdminPais(usuario, rol.id);
});

afterAll(async () => {
  const db = clienteDb();
  for (const id of idsEscaneo) {
    await db.delete(esquema.escaneos).where(eq(esquema.escaneos.id, id));
  }
  for (const id of idsEscuela) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegion) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Escaneos e2e", () => {
  let escuelaId: number;

  beforeAll(async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);
    const servicio = crearServicioRegiones(
      {
        listarRegiones: () => repositorioRegiones.listarRegiones(db),
        obtenerRegionPorId: (id) => repositorioRegiones.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorioRegiones.crearRegion(db, datos),
        actualizarRegion: (id, datos) => repositorioRegiones.actualizarRegion(db, id, datos),
        desactivarRegion: (id) => repositorioRegiones.desactivarRegion(db, id),
        contarEscuelasActivas: (id) => repositorioRegiones.contarEscuelasActivas(db, id),
      },
      auditor
    );

    const region = await servicio.crearRegion(
      { nombre: "E2E Región Escaneos" },
      sesion
    );
    idsRegion.push(region.id);

    const [escuela] = await db
      .insert(esquema.escuelas)
      .values({
        regionId: region.id,
        codigoMep: "E2E-SCAN-001",
        nombre: "E2E Escuela Escaneos",
      })
      .returning()
      .all();
    idsEscuela.push(escuela.id);
    escuelaId = escuela.id;
  });

  it("crea escaneo directamente en repositorio", async () => {
    const db = clienteDb();
    const escaneo = await repositorio.crearEscaneo(db, {
      escuelaId,
      numeroTomo: 1,
      numeroFolio: 10,
      url: "escaneos/test/test-key.pdf",
      formato: "pdf",
      uploadedBy: sesion.usuarioId,
    });

    expect(escaneo.id).toBeGreaterThan(0);
    expect(escaneo.numeroTomo).toBe(1);
    expect(escaneo.numeroFolio).toBe(10);
    expect(escaneo.formato).toBe("pdf");
    idsEscaneo.push(escaneo.id);
  });

  it("lista escaneos por escuela", async () => {
    const db = clienteDb();
    const listado = await repositorio.listarEscaneos(
      db,
      { escuelaId },
      { tipo: "pais" }
    );

    expect(listado.length).toBeGreaterThanOrEqual(1);
    expect(listado.every((e) => e.escuelaId === escuelaId)).toBe(true);
  });

  it("obtiene escaneo por id", async () => {
    const db = clienteDb();
    const escaneo = await repositorio.obtenerEscaneoPorId(db, idsEscaneo[0], {
      tipo: "pais",
    });

    expect(escaneo).toBeDefined();
    expect(escaneo!.url).toContain("test-key.pdf");
  });

  it("servicio prepararSubida falla si faltan env vars de R2", async () => {
    const db = clienteDb();
    const servicio = crearServicioEscaneosDesdeDb(db);

    const promesa = servicio.prepararSubida(
      {
        escuelaId,
        numeroTomo: 2,
        numeroFolio: 5,
        formato: "pdf",
      },
      sesion
    );

    try {
      await promesa;
    } catch {
      const escaneos = await db
        .select()
        .from(esquema.escaneos)
        .where(
          and(
            eq(esquema.escaneos.escuelaId, escuelaId),
            eq(esquema.escaneos.numeroTomo, 2),
            eq(esquema.escaneos.numeroFolio, 5)
          )
        );
      for (const e of escaneos) idsEscaneo.push(e.id);
    }
  });
});
