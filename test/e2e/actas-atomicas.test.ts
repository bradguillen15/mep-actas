import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq, inArray, like, sql } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearServicioActasDesdeDb } from "@/server/servicios/actas.fabrica";
import {
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  datosSesionAdminEscuela,
  limpiarAuditoriaDeAmbito,
  EMAIL_ADMIN_ESCUELA,
} from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
const PREFIJO_CEDULA = "ATOM-";
const CERTIFICADO_QUE_FALLA = 9999;
let db: LibSQLDatabase<typeof esquema>;

let regionId: number;
let escuelaId: number;
let tipoActaId: number;
let sesion: ReturnType<typeof datosSesionAdminEscuela>;

function datosActa(titulo: string) {
  return {
    escuelaId,
    tipoActaId,
    titulo,
    numeroTomo: 1,
    folioInicio: 1,
    folioFin: 2,
    fecha: new Date().toISOString(),
  };
}

function estudiante(numero: number, extra: Record<string, unknown> = {}) {
  return {
    identificacion: `${PREFIJO_CEDULA}${numero}`,
    nombres: `Nombre ${numero}`,
    apellidos: `Apellido ${numero}`,
    numeroCertificado: 5000 + numero,
    ...extra,
  };
}

async function contar(tabla: "actas" | "personas" | "vinculos", titulo = "") {
  if (tabla === "actas") {
    return (
      await db.select().from(esquema.actas).where(eq(esquema.actas.titulo, titulo))
    ).length;
  }
  if (tabla === "personas") {
    return (
      await db
        .select()
        .from(esquema.personas)
        .where(like(esquema.personas.identificacion, `${PREFIJO_CEDULA}%`))
    ).length;
  }
  return (await db.select().from(esquema.actaEstudiantes)).length;
}

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  const rol = await obtenerRolPorNivel(db, 3);
  const usuario = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_ESCUELA);

  [{ id: regionId }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región Atomicidad", activo: true })
    .returning()
    .all();
  [{ id: escuelaId }] = await db
    .insert(esquema.escuelas)
    .values({
      nombre: "Escuela Atomicidad",
      regionId,
      codigoMep: "ATOM-001",
      activo: true,
    })
    .returning()
    .all();
  sesion = datosSesionAdminEscuela(usuario, rol.id, escuelaId);
  await db.run(sql`DROP TRIGGER IF EXISTS tr_atomicidad_certificado_prohibido`);
  await db.run(sql`
    CREATE TRIGGER tr_atomicidad_certificado_prohibido
    BEFORE INSERT ON acta_estudiantes
    WHEN NEW.numero_certificado = ${sql.raw(String(CERTIFICADO_QUE_FALLA))}
    BEGIN SELECT RAISE(ABORT, 'certificado prohibido'); END
  `);
  [{ id: tipoActaId }] = await db.select().from(esquema.tiposActas).limit(1);
});

afterAll(async () => {
  await db.run(sql`DROP TRIGGER IF EXISTS tr_atomicidad_certificado_prohibido`);
  const actas = await db
    .select()
    .from(esquema.actas)
    .where(eq(esquema.actas.escuelaId, escuelaId));
  const actaIds = actas.map((acta) => acta.id);
  if (actaIds.length > 0) {
    await db
      .delete(esquema.actaEstudiantes)
      .where(inArray(esquema.actaEstudiantes.actaId, actaIds));
    await db.delete(esquema.actas).where(inArray(esquema.actas.id, actaIds));
  }
  const personas = await db
    .select()
    .from(esquema.personas)
    .where(like(esquema.personas.identificacion, `${PREFIJO_CEDULA}%`));
  const personaIds = personas.map((persona) => persona.id);
  if (personaIds.length > 0) {
    await db
      .delete(esquema.estudiantes)
      .where(inArray(esquema.estudiantes.personaId, personaIds));
    await db
      .delete(esquema.auditoria)
      .where(
        inArray(esquema.auditoria.registroId, personaIds)
      );
    await db
      .delete(esquema.personas)
      .where(inArray(esquema.personas.id, personaIds));
  }
  await limpiarAuditoriaDeAmbito(db, [escuelaId], [regionId]);
  await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, escuelaId));
  await db.delete(esquema.regiones).where(eq(esquema.regiones.id, regionId));
});

describe("Creación atómica de actas con estudiantes", () => {
  it("crea acta, personas y vínculos juntos y audita todo", async () => {
    const servicio = crearServicioActasDesdeDb(db);

    const acta = await servicio.crearActaConEstudiantes(
      datosActa("Atómica exitosa"),
      [estudiante(1), estudiante(2)],
      sesion
    );

    expect(acta.estudiantes).toHaveLength(2);
    const detalle = await servicio.obtenerActaPorId(acta.id, { tipo: "pais" });
    expect(detalle.estudiantes.map((e) => e.identificacion).sort()).toEqual([
      `${PREFIJO_CEDULA}1`,
      `${PREFIJO_CEDULA}2`,
    ]);
    const auditoria = await db
      .select()
      .from(esquema.auditoria)
      .where(eq(esquema.auditoria.escuelaId, escuelaId));
    const acciones = auditoria.map((fila) => `${fila.tabla}:${fila.accion}`);
    expect(acciones).toContain("actas:crear");
    expect(acciones).toContain("acta_estudiantes:agregar_estudiante");
  });

  it("si el segundo estudiante falla no queda acta, personas ni vínculos", async () => {
    const servicio = crearServicioActasDesdeDb(db);
    const personasAntes = await contar("personas");
    const vinculosAntes = await contar("vinculos");

    await expect(
      servicio.crearActaConEstudiantes(
        datosActa("Atómica fallida"),
        [estudiante(10), estudiante(11, { nombres: "", apellidos: "" })],
        sesion
      )
    ).rejects.toMatchObject({
      name: "ValidationError",
      message: expect.stringContaining(`Estudiante 2 (cédula ${PREFIJO_CEDULA}11)`),
    });

    expect(await contar("actas", "Atómica fallida")).toBe(0);
    expect(await contar("personas")).toBe(personasAntes);
    expect(await contar("vinculos")).toBe(vinculosAntes);
  });

  it("revierte también ante un error de base de datos a mitad de la transacción", async () => {
    const servicio = crearServicioActasDesdeDb(db);
    const personasAntes = await contar("personas");
    const vinculosAntes = await contar("vinculos");

    await expect(
      servicio.crearActaConEstudiantes(
        datosActa("Atómica error BD"),
        [estudiante(20), estudiante(21, { numeroCertificado: CERTIFICADO_QUE_FALLA })],
        sesion
      )
    ).rejects.toMatchObject({
      name: "PersistenceError",
      message: expect.stringContaining(`Estudiante 2 (cédula ${PREFIJO_CEDULA}21)`),
    });

    expect(await contar("actas", "Atómica error BD")).toBe(0);
    expect(await contar("personas")).toBe(personasAntes);
    expect(await contar("vinculos")).toBe(vinculosAntes);
  });

  it("agrega un lote a un acta existente de forma atómica", async () => {
    const servicio = crearServicioActasDesdeDb(db);
    const acta = await servicio.crearActa(datosActa("Atómica lote"), sesion);

    const agregados = await servicio.agregarEstudiantes(
      acta.id,
      [estudiante(30), estudiante(31)],
      sesion
    );

    expect(agregados).toHaveLength(2);
  });

  it("el lote falla completo si un certificado ya existe en el acta", async () => {
    const servicio = crearServicioActasDesdeDb(db);
    const acta = await servicio.crearActa(datosActa("Atómica lote fallido"), sesion);
    await servicio.agregarEstudiantes(acta.id, [estudiante(40)], sesion);
    const personasAntes = await contar("personas");

    await expect(
      servicio.agregarEstudiantes(
        acta.id,
        [estudiante(41), estudiante(42, { numeroCertificado: 5040 })],
        sesion
      )
    ).rejects.toMatchObject({ name: "ValidationError" });

    const detalle = await servicio.obtenerActaPorId(acta.id, { tipo: "pais" });
    expect(detalle.estudiantes).toHaveLength(1);
    expect(await contar("personas")).toBe(personasAntes);
  });

  it("el lote revierte lo ya escrito si un estudiante posterior falla en la base de datos", async () => {
    const servicio = crearServicioActasDesdeDb(db);
    const acta = await servicio.crearActa(datosActa("Atómica lote error BD"), sesion);
    const personasAntes = await contar("personas");

    await expect(
      servicio.agregarEstudiantes(
        acta.id,
        [estudiante(50), estudiante(51, { numeroCertificado: CERTIFICADO_QUE_FALLA })],
        sesion
      )
    ).rejects.toMatchObject({ name: "PersistenceError" });

    const detalle = await servicio.obtenerActaPorId(acta.id, { tipo: "pais" });
    expect(detalle.estudiantes).toHaveLength(0);
    expect(await contar("personas")).toBe(personasAntes);
  });
});
