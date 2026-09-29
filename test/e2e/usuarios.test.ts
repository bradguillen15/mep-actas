import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearServicioUsuariosDesdeDb } from "@/server/servicios/usuarios.fabrica";
import {
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  datosSesionAdminPais,
  datosSesionAdminRegional,
  datosSesionAdminEscuela,
} from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;
let sesionAdminPais: ReturnType<typeof datosSesionAdminPais>;

const idsUsuarioCrear: number[] = [];
const idsPersonaCrear: number[] = [];
const idsFuncionarioCrear: number[] = [];
const idsEscuelaCrear: number[] = [];
const idsRegionCrear: number[] = [];
const idsFuncionarioEscuelaCrear: number[] = [];

function crearServicio() {
  return crearServicioUsuariosDesdeDb(db);
}

let contadorAmbito = 0;

async function crearFuncionarioEnEscuela(regionId: number) {
  contadorAmbito += 1;
  const [{ id: escuelaId }] = await db
    .insert(esquema.escuelas)
    .values({
      regionId,
      codigoMep: `e2e-amb-${contadorAmbito}`,
      nombre: "Escuela E2E",
    })
    .returning()
    .all();
  idsEscuelaCrear.push(escuelaId);

  const [{ id: personaId }] = await db
    .insert(esquema.personas)
    .values({
      identificacion: `7000${contadorAmbito}`.padStart(9, "0"),
      nombres: "Func",
      apellidos: "Ambito",
    })
    .returning()
    .all();
  idsPersonaCrear.push(personaId);

  const [{ id: funcionarioId }] = await db
    .insert(esquema.funcionarios)
    .values({ personaId, puesto: "Staff" })
    .returning()
    .all();
  idsFuncionarioCrear.push(funcionarioId);

  const [{ id: feId }] = await db
    .insert(esquema.funcionarioEscuela)
    .values({ funcionarioId, escuelaId })
    .returning()
    .all();
  idsFuncionarioEscuelaCrear.push(feId);

  return { escuelaId, funcionarioId };
}

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  const usuarioAdminPais = await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test");
  const rolAdminPais = await obtenerRolPorNivel(db, 1);
  sesionAdminPais = datosSesionAdminPais(usuarioAdminPais.id, rolAdminPais.id);

  const [{ id: regionId }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región E2E Usuarios" })
    .returning()
    .all();
  idsRegionCrear.push(regionId);
});

afterAll(async () => {
  for (const id of idsUsuarioCrear) {
    await db.delete(esquema.usuarios).where(eq(esquema.usuarios.id, id));
  }
  for (const id of idsFuncionarioEscuelaCrear) {
    await db
      .delete(esquema.funcionarioEscuela)
      .where(eq(esquema.funcionarioEscuela.id, id));
  }
  for (const id of idsFuncionarioCrear) {
    await db.delete(esquema.funcionarios).where(eq(esquema.funcionarios.id, id));
  }
  for (const id of idsPersonaCrear) {
    await db.delete(esquema.personas).where(eq(esquema.personas.id, id));
  }
  for (const id of idsEscuelaCrear) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegionCrear) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Usuarios e2e", () => {
  it("lista usuarios", async () => {
    const usuarios = await crearServicio().listar({ tipo: "pais" });
    expect(usuarios.length).toBeGreaterThanOrEqual(3);
  });

  it("crea y obtiene usuario", async () => {
    const servicio = crearServicio();

    const [{ id: personaId }] = await db
      .insert(esquema.personas)
      .values({ identificacion: "888888888", nombres: "Nuevo", apellidos: "Usuario Test" })
      .returning()
      .all();
    idsPersonaCrear.push(personaId);

    const [{ id: funcId }] = await db
      .insert(esquema.funcionarios)
      .values({ personaId, puesto: "Staff" })
      .returning()
      .all();
    idsFuncionarioCrear.push(funcId);

    const rolStaff = await obtenerRolPorNivel(db, 4);
    const usuario = await servicio.crear(
      {
        funcionarioId: funcId,
        rolId: rolStaff.id,
        email: "nuevo-staff@e2e.test",
        passwordHash: "fakehash",
      },
      sesionAdminPais
    );

    expect(usuario).toBeDefined();
    expect(usuario.email).toBe("nuevo-staff@e2e.test");
    idsUsuarioCrear.push(usuario.id);

    const obtenido = await servicio.obtenerPorId(usuario.id, { tipo: "pais" });
    expect(obtenido.email).toBe("nuevo-staff@e2e.test");
    expect(obtenido.funcionarioNombres).toBe("Nuevo");
  });

  it("lanza ConflictError si email ya existe", async () => {
    await expect(
      crearServicio().crear(
        {
          funcionarioId: 1,
          rolId: 1,
          email: "admin-pais@e2e.test",
          passwordHash: "fakehash",
        },
        sesionAdminPais
      )
    ).rejects.toThrow("El email ya está registrado");
  });

  it("cambia estado activo de usuario", async () => {
    const servicio = crearServicio();
    const usuarioId = idsUsuarioCrear[0];
    const desactivado = await servicio.cambiarEstado(usuarioId, false, sesionAdminPais);
    expect(desactivado.activo).toBe(false);

    const activado = await servicio.cambiarEstado(usuarioId, true, sesionAdminPais);
    expect(activado.activo).toBe(true);
  });

  it("lanza NotFoundError si usuario no existe", async () => {
    await expect(crearServicio().obtenerPorId(99999, { tipo: "pais" })).rejects.toThrow(
      "Usuario no encontrado"
    );
  });
});

describe("Usuarios e2e — jerarquía y ámbito entre roles", () => {
  it("deniega que un Admin Regional cree un Admin País", async () => {
    const usuarioAdminRegional = await obtenerUsuarioPorEmail(
      db,
      "admin-regional@e2e.test"
    );
    const rolAdminRegional = await obtenerRolPorNivel(db, 2);
    const sesionAdminRegional = datosSesionAdminRegional(
      usuarioAdminRegional.id,
      rolAdminRegional.id,
      idsRegionCrear[0]
    );
    const rolAdminPais = await obtenerRolPorNivel(db, 1);

    await expect(
      crearServicio().crear(
        {
          funcionarioId: 1,
          rolId: rolAdminPais.id,
          email: "intruso-pais@e2e.test",
          passwordHash: "fakehash",
        },
        sesionAdminRegional
      )
    ).rejects.toThrow();

    const creado = await obtenerUsuarioPorEmail(db, "intruso-pais@e2e.test");
    expect(creado).toBeUndefined();
  });

  it("permite que un Admin Regional cree un usuario dentro de su región", async () => {
    const usuarioAdminRegional = await obtenerUsuarioPorEmail(
      db,
      "admin-regional@e2e.test"
    );
    const rolAdminRegional = await obtenerRolPorNivel(db, 2);
    const regionId = idsRegionCrear[0];
    const sesionAdminRegional = datosSesionAdminRegional(
      usuarioAdminRegional.id,
      rolAdminRegional.id,
      regionId
    );

    const { funcionarioId } = await crearFuncionarioEnEscuela(regionId);
    const rolStaff = await obtenerRolPorNivel(db, 4);

    const usuario = await crearServicio().crear(
      {
        funcionarioId,
        rolId: rolStaff.id,
        email: "staff-region@e2e.test",
        passwordHash: "fakehash",
      },
      sesionAdminRegional
    );
    expect(usuario.email).toBe("staff-region@e2e.test");
    idsUsuarioCrear.push(usuario.id);
  });

  it("deniega que un Admin Regional cree un usuario fuera de su región", async () => {
    const usuarioAdminRegional = await obtenerUsuarioPorEmail(
      db,
      "admin-regional@e2e.test"
    );
    const rolAdminRegional = await obtenerRolPorNivel(db, 2);
    const sesionRegionAjena = datosSesionAdminRegional(
      usuarioAdminRegional.id,
      rolAdminRegional.id,
      99999
    );

    const { funcionarioId } = await crearFuncionarioEnEscuela(idsRegionCrear[0]);
    const rolStaff = await obtenerRolPorNivel(db, 4);

    await expect(
      crearServicio().crear(
        {
          funcionarioId,
          rolId: rolStaff.id,
          email: "staff-ajeno@e2e.test",
          passwordHash: "fakehash",
        },
        sesionRegionAjena
      )
    ).rejects.toThrow();

    const creado = await obtenerUsuarioPorEmail(db, "staff-ajeno@e2e.test");
    expect(creado).toBeUndefined();
  });

  it("deniega que un Admin Escuela restablezca la contraseña de un Admin País", async () => {
    const usuarioAdminEscuela = await obtenerUsuarioPorEmail(
      db,
      "admin-escuela@e2e.test"
    );
    const rolAdminEscuela = await obtenerRolPorNivel(db, 3);
    const sesionAdminEscuela = datosSesionAdminEscuela(
      usuarioAdminEscuela.id,
      rolAdminEscuela.id,
      idsEscuelaCrear[0] ?? 1
    );

    const adminPais = await obtenerUsuarioPorEmail(db, "admin-pais@e2e.test");

    await expect(
      crearServicio().actualizarPassword(
        adminPais.id,
        "nuevohash",
        sesionAdminEscuela
      )
    ).rejects.toThrow();
  });
});
