import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { clienteDb } from "@/db/cliente";
import * as esquema from "@/db/esquema";
import { derivarAmbitoConsulta } from "@/server/auth/ambito";
import type { SesionUsuario } from "@/server/auth/tipos";
import { obtenerAmbitoDeFuncionario } from "@/server/repositorios/usuarios.repositorio";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import {
  EMAIL_ADMIN_ESCUELA,
  EMAIL_ADMIN_PAIS,
  EMAIL_ADMIN_REGIONAL,
  EMAIL_STAFF,
  datosSesionAdminEscuela,
  datosSesionAdminPais,
  datosSesionAdminRegional,
  datosSesionStaff,
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
} from "./helpers";

const db = clienteDb();

type ActaConUbicacion = { id: number; escuelaId: number; regionId: number };

let actasDelPais: ActaConUbicacion[];
let sesionPais: SesionUsuario;
let sesionRegional: SesionUsuario;
let sesionEscuela: SesionUsuario;
let sesionStaff: SesionUsuario;

async function listarActasVisibles(sesion: SesionUsuario) {
  const servicio = crearServicioActasDesdeDb(db);
  return servicio.listarActas({}, derivarAmbitoConsulta(sesion));
}

async function primeraEscuelaDe(email: string) {
  const usuario = await obtenerUsuarioPorEmail(db, email);
  const ambito = await obtenerAmbitoDeFuncionario(db, usuario.funcionarioId);
  return { usuario, ambito };
}

beforeAll(async () => {
  const filas = await db
    .select({
      id: esquema.actas.id,
      escuelaId: esquema.actas.escuelaId,
      regionId: esquema.escuelas.regionId,
    })
    .from(esquema.actas)
    .innerJoin(esquema.escuelas, eq(esquema.actas.escuelaId, esquema.escuelas.id));
  actasDelPais = filas;

  const pais = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  sesionPais = datosSesionAdminPais(pais, (await obtenerRolPorNivel(db, 1)).id);

  const regional = await primeraEscuelaDe(EMAIL_ADMIN_REGIONAL);
  sesionRegional = datosSesionAdminRegional(
    regional.usuario,
    (await obtenerRolPorNivel(db, 2)).id,
    regional.ambito.regionIds[0]
  );

  const escuela = await primeraEscuelaDe(EMAIL_ADMIN_ESCUELA);
  sesionEscuela = datosSesionAdminEscuela(
    escuela.usuario,
    (await obtenerRolPorNivel(db, 3)).id,
    escuela.ambito.escuelaIds[0]
  );

  const staff = await primeraEscuelaDe(EMAIL_STAFF);
  sesionStaff = datosSesionStaff(
    staff.usuario,
    (await obtenerRolPorNivel(db, 4)).id,
    staff.ambito.escuelaIds[0]
  );
});

describe("Semilla compartida: actas visibles por rol", () => {
  it("Admin País ve las actas de todas las regiones sembradas", async () => {
    const visibles = await listarActasVisibles(sesionPais);
    const regionesConActas = new Set(actasDelPais.map((a) => a.regionId));

    expect(visibles.length).toBe(actasDelPais.length);
    expect(regionesConActas.size).toBeGreaterThanOrEqual(3);
  });

  it("Admin Regional solo ve las actas de su región", async () => {
    const visibles = await listarActasVisibles(sesionRegional);
    const idsEsperados = actasDelPais
      .filter((a) => a.regionId === sesionRegional.regionId)
      .map((a) => a.id);

    expect(visibles.length).toBeGreaterThan(0);
    expect(visibles.length).toBeLessThan(actasDelPais.length);
    expect(visibles.map((a) => a.id).sort()).toEqual(idsEsperados.sort());
  });

  it("Admin Escuela solo ve las actas de su escuela", async () => {
    const visibles = await listarActasVisibles(sesionEscuela);
    const idsEsperados = actasDelPais
      .filter((a) => a.escuelaId === sesionEscuela.escuelaId)
      .map((a) => a.id);

    expect(visibles.length).toBeGreaterThan(0);
    expect(visibles.map((a) => a.id).sort()).toEqual(idsEsperados.sort());
  });

  it("Staff solo ve las actas de su escuela", async () => {
    const visibles = await listarActasVisibles(sesionStaff);
    const idsEsperados = actasDelPais
      .filter((a) => a.escuelaId === sesionStaff.escuelaId)
      .map((a) => a.id);

    expect(visibles.length).toBeGreaterThan(0);
    expect(visibles.map((a) => a.id).sort()).toEqual(idsEsperados.sort());
  });
});
