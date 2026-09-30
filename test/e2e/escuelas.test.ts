import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioEscuelas } from "@/server/servicios/escuelas.servicio";
import { crearServicioRegiones } from "@/server/servicios/regiones.servicio";
import * as repositorioEscuelas from "@/server/repositorios/escuelas.repositorio";
import * as repositorioRegiones from "@/server/repositorios/regiones.repositorio";
import {
  datosSesionAdminPais,
  datosSesionAdminRegional,
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  limpiarAuditoriaDeAmbito,
} from "./helpers";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
let sesionPais: SesionUsuario;
let sesionRegional: SesionUsuario;

beforeAll(async () => {
  const db = clienteDb();
  const rolPais = await obtenerRolPorNivel(db, 1);
  const usuarioPais = await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test");
  sesionPais = datosSesionAdminPais(usuarioPais.id, rolPais.id);

  const rolRegional = await obtenerRolPorNivel(db, 2);
  const usuarioRegional = await obtenerUsuarioPorEmail(
    db,
    "admin-regional@e2e.test"
  );
  sesionRegional = datosSesionAdminRegional(
    usuarioRegional.id,
    rolRegional.id,
    1
  );
});

afterAll(async () => {
  const db = clienteDb();
  await limpiarAuditoriaDeAmbito(db, idsEscuela, idsRegion);
  for (const id of idsEscuela) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegion) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Escuelas e2e", () => {
  it("crea escuela asociada a una región", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);
    const servicioRegion = crearServicioRegiones(
      {
        listarRegiones: () => repositorioRegiones.listarRegiones(db),
        obtenerRegionPorId: (id: number) =>
          repositorioRegiones.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorioRegiones.crearRegion(db, datos),
        actualizarRegion: (id, datos) =>
          repositorioRegiones.actualizarRegion(db, id, datos),
        desactivarRegion: (id) =>
          repositorioRegiones.desactivarRegion(db, id),
        contarEscuelasActivas: (id) =>
          repositorioRegiones.contarEscuelasActivas(db, id),
      },
      auditor
    );

    const servicio = crearServicioEscuelas(
      {
        listarEscuelas: (filtros) =>
          repositorioEscuelas.listarEscuelas(db, filtros),
        obtenerEscuelaPorId: (id) =>
          repositorioEscuelas.obtenerEscuelaPorId(db, id),
        crearEscuela: (datos) => repositorioEscuelas.crearEscuela(db, datos),
        actualizarEscuela: (id, datos) =>
          repositorioEscuelas.actualizarEscuela(db, id, datos),
        desactivarEscuela: (id) =>
          repositorioEscuelas.desactivarEscuela(db, id),
        contarActasActivas: (id) =>
          repositorioEscuelas.contarActasActivas(db, id),
      },
      auditor
    );

    const region = await servicioRegion.crearRegion(
      { nombre: "E2E Región Escuelas" },
      sesionPais
    );
    idsRegion.push(region.id);

    const escuela = await servicio.crearEscuela(
      {
        regionId: region.id,
        codigoMep: "E2E-001",
        nombre: "E2E Escuela Test",
      },
      sesionPais
    );
    expect(escuela.id).toBeGreaterThan(0);
    expect(escuela.codigoMep).toBe("E2E-001");
    expect(escuela.nombre).toBe("E2E Escuela Test");
    expect(escuela.regionId).toBe(region.id);
    expect(escuela.activo).toBe(true);
    idsEscuela.push(escuela.id);

    const escuelas = await servicio.listarEscuelas({ regionId: region.id });
    expect(escuelas.some((e) => e.id === escuela.id)).toBe(true);

    const actualizada = await servicio.actualizarEscuela(
      escuela.id,
      { nombre: "E2E Escuela Actualizada" },
      sesionPais
    );
    expect(actualizada?.nombre).toBe("E2E Escuela Actualizada");

    const desactivada = await servicio.desactivarEscuela(escuela.id, sesionPais);
    expect(desactivada?.activo).toBe(false);
  });

  it("Admin Regional solo crea escuelas en su región", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);
    const servicioRegion = crearServicioRegiones(
      {
        listarRegiones: () => repositorioRegiones.listarRegiones(db),
        obtenerRegionPorId: (id: number) =>
          repositorioRegiones.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorioRegiones.crearRegion(db, datos),
        actualizarRegion: (id, datos) =>
          repositorioRegiones.actualizarRegion(db, id, datos),
        desactivarRegion: (id) =>
          repositorioRegiones.desactivarRegion(db, id),
        contarEscuelasActivas: (id) =>
          repositorioRegiones.contarEscuelasActivas(db, id),
      },
      auditor
    );

    const regionA = await servicioRegion.crearRegion(
      { nombre: "E2E Región A" },
      sesionPais
    );
    idsRegion.push(regionA.id);

    const regionB = await servicioRegion.crearRegion(
      { nombre: "E2E Región B" },
      sesionPais
    );
    idsRegion.push(regionB.id);

    const servicioEscuela = crearServicioEscuelas(
      {
        listarEscuelas: (filtros) =>
          repositorioEscuelas.listarEscuelas(db, filtros),
        obtenerEscuelaPorId: (id) =>
          repositorioEscuelas.obtenerEscuelaPorId(db, id),
        crearEscuela: (datos) => repositorioEscuelas.crearEscuela(db, datos),
        actualizarEscuela: (id, datos) =>
          repositorioEscuelas.actualizarEscuela(db, id, datos),
        desactivarEscuela: (id) =>
          repositorioEscuelas.desactivarEscuela(db, id),
        contarActasActivas: (id) =>
          repositorioEscuelas.contarActasActivas(db, id),
      },
      auditor
    );

    const sesionRegionalB = datosSesionAdminRegional(
      sesionRegional.usuarioId,
      sesionRegional.rolId,
      regionA.id
    );

    const escuela = await servicioEscuela.crearEscuela(
      {
        regionId: regionA.id,
        codigoMep: "E2E-002",
        nombre: "E2E Escuela Regional",
      },
      sesionRegionalB
    );
    expect(escuela.id).toBeGreaterThan(0);
    idsEscuela.push(escuela.id);

    await expect(
      servicioEscuela.crearEscuela(
        {
          regionId: regionB.id,
          codigoMep: "E2E-003",
          nombre: "E2E Escuela Fuera de Región",
        },
        sesionRegionalB
      )
    ).rejects.toThrow("No tiene permisos para crear escuelas en esta región");
  });
});
