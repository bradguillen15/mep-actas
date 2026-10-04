import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { clienteDb } from "@/db/cliente";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioRegiones } from "@/server/servicios/regiones.servicio";
import * as repositorio from "@/server/repositorios/regiones.repositorio";
import { datosSesionAdminPais, obtenerRolPorNivel, obtenerUsuarioPorEmail,
  limpiarAuditoriaDeAmbito,
  EMAIL_ADMIN_PAIS,
} from "./helpers";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";

const idsCreados: number[] = [];
let sesionAdminPais: SesionUsuario;

beforeAll(async () => {
  const db = clienteDb();
  const rol = await obtenerRolPorNivel(db, 1);
  const usuario = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  sesionAdminPais = datosSesionAdminPais(usuario, rol.id);
});

afterAll(async () => {
  const db = clienteDb();
  await limpiarAuditoriaDeAmbito(db, [], idsCreados);
  for (const id of idsCreados) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Regiones e2e", () => {
  it("crea, lista, actualiza y desactiva una región", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);
    const servicio = crearServicioRegiones(
      {
        listarRegiones: () => repositorio.listarRegiones(db),
        obtenerRegionPorId: (id: number) => repositorio.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorio.crearRegion(db, datos),
        actualizarRegion: (id, datos) => repositorio.actualizarRegion(db, id, datos),
        desactivarRegion: (id) => repositorio.desactivarRegion(db, id),
        contarEscuelasActivas: (id) => repositorio.contarEscuelasActivas(db, id),
      },
      auditor
    );

    const region = await servicio.crearRegion(
      { nombre: "E2E Región Test" },
      sesionAdminPais
    );
    expect(region.id).toBeGreaterThan(0);
    expect(region.nombre).toBe("E2E Región Test");
    expect(region.activo).toBe(true);
    idsCreados.push(region.id);

    const listado = await servicio.listarRegiones();
    expect(listado.some((r) => r.id === region.id)).toBe(true);

    const actualizada = await servicio.actualizarRegion(
      region.id,
      { nombre: "E2E Región Actualizada" },
      sesionAdminPais
    );
    expect(actualizada?.nombre).toBe("E2E Región Actualizada");

    const desactivada = await servicio.desactivarRegion(region.id, sesionAdminPais);
    expect(desactivada?.activo).toBe(false);
  });

  it("rechaza crear región con nombre vacío", async () => {
    const db = clienteDb();
    const auditor = crearAuditor(db);
    const servicio = crearServicioRegiones(
      {
        listarRegiones: () => repositorio.listarRegiones(db),
        obtenerRegionPorId: (id: number) => repositorio.obtenerRegionPorId(db, id),
        crearRegion: (datos) => repositorio.crearRegion(db, datos),
        actualizarRegion: (id, datos) => repositorio.actualizarRegion(db, id, datos),
        desactivarRegion: (id) => repositorio.desactivarRegion(db, id),
        contarEscuelasActivas: (id) => repositorio.contarEscuelasActivas(db, id),
      },
      auditor
    );

    await expect(
      servicio.crearRegion({ nombre: "" }, sesionAdminPais)
    ).rejects.toThrow("El nombre de la región no puede estar vacío");
  });
});
