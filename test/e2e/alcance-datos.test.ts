import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq, inArray } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { SesionUsuario } from "@/server/auth/tipos";
import { derivarAmbitoConsulta, type AmbitoConsulta } from "@/server/auth/ambito";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import { crearServicioGraduacionesDesdeDb } from "@/server/servicios/graduaciones.fabrica";
import { crearServicioEscaneosDesdeDb } from "@/server/servicios/escaneos.fabrica";
import { crearServicioPersonasDesdeDb } from "@/server/servicios/personas.fabrica";
import { crearServicioFuncionariosDesdeDb } from "@/server/servicios/funcionarios.fabrica";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { listarAuditoria } from "@/server/repositorios/auditoria.repositorio";
import { limpiarAuditoriaDeAmbito, obtenerUsuarioPorEmail } from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
const PREFIJO = `ALC${Date.now()}`;

let db: LibSQLDatabase<typeof esquema>;
let usuarioId: number;
let tipoActaId: number;

const ids = {
  regionPropia: 0,
  regionAjena: 0,
  escuelaA: 0,
  escuelaB: 0,
  escuelaC: 0,
  actaA: 0,
  actaC: 0,
  personaA: 0,
  personaC: 0,
  personaMulti: 0,
  funcionarioMulti: 0,
  estudiantes: [] as number[],
  escaneos: [] as number[],
};

function sesion(parcial: Partial<SesionUsuario> & Pick<SesionUsuario, "nivel">): SesionUsuario {
  return { usuarioId, email: "alcance@e2e.test", rolId: 1, funcionarioId: 1, ...parcial };
}

const pais: AmbitoConsulta = { tipo: "pais" };
const ambitoEscuelaA = (): AmbitoConsulta => ({ tipo: "escuela", escuelaId: ids.escuelaA });
const ambitoRegionPropia = (): AmbitoConsulta => ({ tipo: "region", regionId: ids.regionPropia });

async function insertarRegion(nombre: string) {
  const [fila] = await db.insert(esquema.regiones).values({ nombre }).returning();
  return fila.id;
}

async function insertarEscuela(regionId: number, sufijo: string) {
  const [fila] = await db
    .insert(esquema.escuelas)
    .values({ regionId, codigoMep: `${PREFIJO}-${sufijo}`, nombre: `${PREFIJO} ${sufijo}` })
    .returning();
  return fila.id;
}

async function insertarActa(escuelaId: number) {
  const [fila] = await db
    .insert(esquema.actas)
    .values({
      escuelaId,
      tipoActaId,
      titulo: `${PREFIJO} acta ${escuelaId}`,
      numeroTomo: 1,
      folioInicio: 1,
      folioFin: 2,
      fecha: "2025-12-01",
    })
    .returning();
  return fila.id;
}

async function insertarGraduado(actaId: number, sufijo: string) {
  const [persona] = await db
    .insert(esquema.personas)
    .values({ identificacion: `${PREFIJO}${sufijo}`, nombres: PREFIJO, apellidos: sufijo })
    .returning();
  const [estudiante] = await db
    .insert(esquema.estudiantes)
    .values({ personaId: persona.id })
    .returning();
  ids.estudiantes.push(estudiante.id);
  await db
    .insert(esquema.actaEstudiantes)
    .values({ actaId, estudianteId: estudiante.id, numeroCertificado: 1 });
  return persona.id;
}

async function insertarEscaneo(escuelaId: number) {
  const [fila] = await db
    .insert(esquema.escaneos)
    .values({
      escuelaId,
      numeroTomo: 1,
      numeroFolio: 1,
      url: `escaneos/${escuelaId}/1/1.jpg`,
      formato: "jpg",
      uploadedBy: usuarioId,
    })
    .returning();
  ids.escaneos.push(fila.id);
}

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  usuarioId = (await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test")).id;
  tipoActaId = (await db.select().from(esquema.tiposActas).limit(1))[0].id;

  ids.regionPropia = await insertarRegion(`${PREFIJO} propia`);
  ids.regionAjena = await insertarRegion(`${PREFIJO} ajena`);
  ids.escuelaA = await insertarEscuela(ids.regionPropia, "A");
  ids.escuelaB = await insertarEscuela(ids.regionPropia, "B");
  ids.escuelaC = await insertarEscuela(ids.regionAjena, "C");
  ids.actaA = await insertarActa(ids.escuelaA);
  ids.actaC = await insertarActa(ids.escuelaC);
  ids.personaA = await insertarGraduado(ids.actaA, "A");
  ids.personaC = await insertarGraduado(ids.actaC, "C");
  await insertarEscaneo(ids.escuelaA);
  await insertarEscaneo(ids.escuelaC);

  const [personaMulti] = await db
    .insert(esquema.personas)
    .values({ identificacion: `${PREFIJO}M`, nombres: PREFIJO, apellidos: "Multi" })
    .returning();
  ids.personaMulti = personaMulti.id;
  const [funcionario] = await db
    .insert(esquema.funcionarios)
    .values({ personaId: personaMulti.id, puesto: "Supervisor" })
    .returning();
  ids.funcionarioMulti = funcionario.id;
  await db.insert(esquema.funcionarioEscuela).values([
    { funcionarioId: funcionario.id, escuelaId: ids.escuelaA },
    { funcionarioId: funcionario.id, escuelaId: ids.escuelaB },
    { funcionarioId: funcionario.id, escuelaId: ids.escuelaC },
  ]);
});

afterAll(async () => {
  const escuelas = [ids.escuelaA, ids.escuelaB, ids.escuelaC];
  const regiones = [ids.regionPropia, ids.regionAjena];
  await limpiarAuditoriaDeAmbito(db, escuelas, regiones);
  await db.delete(esquema.funcionarioEscuela).where(eq(esquema.funcionarioEscuela.funcionarioId, ids.funcionarioMulti));
  await db.delete(esquema.funcionarios).where(eq(esquema.funcionarios.id, ids.funcionarioMulti));
  await db.delete(esquema.escaneos).where(inArray(esquema.escaneos.id, ids.escaneos));
  await db.delete(esquema.actaEstudiantes).where(inArray(esquema.actaEstudiantes.estudianteId, ids.estudiantes));
  await db.delete(esquema.estudiantes).where(inArray(esquema.estudiantes.id, ids.estudiantes));
  await db.delete(esquema.personas).where(inArray(esquema.personas.id, [ids.personaA, ids.personaC, ids.personaMulti]));
  await db.delete(esquema.actas).where(inArray(esquema.actas.id, [ids.actaA, ids.actaC]));
  await db.delete(esquema.escuelas).where(inArray(esquema.escuelas.id, escuelas));
  await db.delete(esquema.regiones).where(inArray(esquema.regiones.id, regiones));
});

describe("Conformidad de ámbito — actas", () => {
  async function actasVisibles(ambito: AmbitoConsulta) {
    const actas = await crearServicioActasDesdeDb(db).listarActas({}, ambito);
    return actas.map((acta) => acta.id).filter((id) => [ids.actaA, ids.actaC].includes(id));
  }

  it("cada nivel lista solo las actas de su ámbito", async () => {
    expect(await actasVisibles(pais)).toEqual([ids.actaA, ids.actaC]);
    expect(await actasVisibles(ambitoRegionPropia())).toEqual([ids.actaA]);
    expect(await actasVisibles(ambitoEscuelaA())).toEqual([ids.actaA]);
  });

  it("un filtro de escuela ajena del cliente devuelve vacío", async () => {
    const actas = await crearServicioActasDesdeDb(db).listarActas({ escuelaId: ids.escuelaC }, ambitoEscuelaA());
    expect(actas).toEqual([]);
  });

  it("un acta de otra escuela responde NotFoundError", async () => {
    await expect(
      crearServicioActasDesdeDb(db).obtenerActaPorId(ids.actaC, ambitoEscuelaA())
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });

  it("una sesión inconsistente no ve nada", async () => {
    const ambito = derivarAmbitoConsulta(sesion({ nivel: 3 }));
    expect(await actasVisibles(ambito)).toEqual([]);
    await expect(
      crearServicioActasDesdeDb(db).obtenerActaPorId(ids.actaA, ambito)
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });
});

describe("Conformidad de ámbito — graduaciones", () => {
  it("la búsqueda y su total respetan el ámbito", async () => {
    const servicio = crearServicioGraduacionesDesdeDb(db);
    const enPais = await servicio.buscar({ nombre: PREFIJO }, pais);
    const enRegion = await servicio.buscar({ nombre: PREFIJO }, ambitoRegionPropia());
    const enEscuelaC = await servicio.buscar({ nombre: PREFIJO }, { tipo: "escuela", escuelaId: ids.escuelaC });
    expect(enPais.total).toBe(2);
    expect(enRegion.total).toBe(1);
    expect(enRegion.datos[0].identificacion).toBe(`${PREFIJO}A`);
    expect(enEscuelaC.total).toBe(1);
  });

  it("el detalle de un acta ajena responde NotFoundError", async () => {
    await expect(
      crearServicioGraduacionesDesdeDb(db).obtenerPorId(ids.actaC, ambitoRegionPropia())
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });
});

describe("Conformidad de ámbito — escaneos", () => {
  it("la escuela solo lista sus escaneos", async () => {
    const escaneos = await crearServicioEscaneosDesdeDb(db).listarEscaneos({}, ambitoEscuelaA());
    const propios = escaneos.filter((escaneo) => ids.escaneos.includes(escaneo.id));
    expect(propios.map((escaneo) => escaneo.escuelaId)).toEqual([ids.escuelaA]);
  });
});

describe("Conformidad de ámbito — personas y funcionarios", () => {
  it("la identificación exacta de otra escuela devuelve solo datos mínimos", async () => {
    const resultado = await crearServicioPersonasDesdeDb(db).buscarPersonaPorIdentificacionExacta(`${PREFIJO}C`);
    expect(resultado).toEqual([
      { id: ids.personaC, identificacion: `${PREFIJO}C`, nombres: PREFIJO, apellidos: "C" },
    ]);
  });

  it("la búsqueda parcial excluye personas fuera del ámbito", async () => {
    const personas = await crearServicioPersonasDesdeDb(db).listarPersonas(PREFIJO, ambitoEscuelaA());
    expect(personas.map((persona) => persona.id).sort((a, b) => a - b)).toEqual(
      [ids.personaA, ids.personaMulti].sort((a, b) => a - b)
    );
  });

  it("un funcionario de varias escuelas aparece una sola vez", async () => {
    const funcionarios = await crearServicioFuncionariosDesdeDb(db).listarFuncionarios(undefined, ambitoRegionPropia());
    expect(funcionarios.filter((f) => f.id === ids.funcionarioMulti)).toHaveLength(1);
  });
});

describe("Conformidad de ámbito — auditoría", () => {
  beforeAll(async () => {
    const auditor = crearAuditor(db);
    const base = { usuarioId, accion: "prueba", datosAnteriores: null, datosNuevos: null };
    await auditor({ ...base, tabla: "actas", registroId: ids.actaA, escuelaId: ids.escuelaA });
    await auditor({ ...base, tabla: "regiones", registroId: ids.regionPropia, regionId: ids.regionPropia });
  });

  async function registrosVisibles(ambito: AmbitoConsulta) {
    const filas = await listarAuditoria(db, { accion: "prueba", limite: 1000 }, ambito);
    return filas
      .filter((fila) => [ids.actaA, ids.regionPropia].includes(fila.registroId))
      .map((fila) => fila.tabla)
      .sort();
  }

  it("la escuela y la región se pueblan al escribir", async () => {
    const [fila] = await db
      .select()
      .from(esquema.auditoria)
      .where(eq(esquema.auditoria.escuelaId, ids.escuelaA));
    expect(fila.regionId).toBe(ids.regionPropia);
  });

  it("la fila regional la ve el nivel 2 y no el nivel 3", async () => {
    expect(await registrosVisibles(ambitoRegionPropia())).toEqual(["actas", "regiones"]);
    expect(await registrosVisibles(ambitoEscuelaA())).toEqual(["actas"]);
  });

  it("otra región no ve estas filas", async () => {
    expect(await registrosVisibles({ tipo: "region", regionId: ids.regionAjena })).toEqual([]);
  });
});
