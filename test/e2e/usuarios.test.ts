import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { crearAuditor } from "@/server/servicios/auditoria.servicio";
import { crearServicioUsuarios } from "@/server/servicios/usuarios.servicio";
import * as repositorio from "@/server/repositorios/usuarios.repositorio";
import {
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  datosSesionAdminPais,
  datosSesionAdminRegional,
} from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;
let sesionAdminPais: ReturnType<typeof datosSesionAdminPais>;
let sesionAdminRegional: ReturnType<typeof datosSesionAdminRegional>;
const idsUsuarioCrear: number[] = [];
const idsPersonaCrear: number[] = [];
const idsFuncionarioCrear: number[] = [];

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  const usuarioAdminPais = await obtenerUsuarioPorEmail(
    db,
    "admin-pais@e2e.test"
  );
  const rolAdminPais = await obtenerRolPorNivel(db, 1);
  sesionAdminPais = datosSesionAdminPais(
    usuarioAdminPais.id,
    rolAdminPais.id
  );

  const usuarioAdminRegional = await obtenerUsuarioPorEmail(
    db,
    "admin-regional@e2e.test"
  );
  const rolAdminRegional = await obtenerRolPorNivel(db, 2);
  sesionAdminRegional = datosSesionAdminRegional(
    usuarioAdminRegional.id,
    rolAdminRegional.id,
    1
  );
});

afterAll(async () => {
  for (const id of idsUsuarioCrear) {
    await db.delete(esquema.usuarios).where(eq(esquema.usuarios.id, id));
  }
  for (const id of idsFuncionarioCrear) {
    await db.delete(esquema.funcionarios).where(eq(esquema.funcionarios.id, id));
  }
  for (const id of idsPersonaCrear) {
    await db.delete(esquema.personas).where(eq(esquema.personas.id, id));
  }
});

describe("Usuarios e2e", () => {
  it("lista usuarios", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: () => repositorio.listarUsuarios(db),
        obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
        obtenerUsuarioPorEmail: (email) =>
          repositorio.obtenerUsuarioPorEmail(db, email),
        crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
        actualizarPassword: (id, pwHash) =>
          repositorio.actualizarPassword(db, id, pwHash),
        cambiarEstadoUsuario: (id, activo) =>
          repositorio.cambiarEstadoUsuario(db, id, activo),
      },
      auditor
    );

    const usuarios = await servicio.listar();
    expect(usuarios.length).toBeGreaterThanOrEqual(3);
  });

  it("crea y obtiene usuario", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: () => repositorio.listarUsuarios(db),
        obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
        obtenerUsuarioPorEmail: (email) =>
          repositorio.obtenerUsuarioPorEmail(db, email),
        crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
        actualizarPassword: (id, pwHash) =>
          repositorio.actualizarPassword(db, id, pwHash),
        cambiarEstadoUsuario: (id, activo) =>
          repositorio.cambiarEstadoUsuario(db, id, activo),
      },
      auditor
    );

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

    const obtenido = await servicio.obtenerPorId(usuario.id);
    expect(obtenido.email).toBe("nuevo-staff@e2e.test");
    expect(obtenido.funcionarioNombres).toBe("Nuevo");
  });

  it("lanza ConflictError si email ya existe", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: () => repositorio.listarUsuarios(db),
        obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
        obtenerUsuarioPorEmail: (email) =>
          repositorio.obtenerUsuarioPorEmail(db, email),
        crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
        actualizarPassword: (id, pwHash) =>
          repositorio.actualizarPassword(db, id, pwHash),
        cambiarEstadoUsuario: (id, activo) =>
          repositorio.cambiarEstadoUsuario(db, id, activo),
      },
      auditor
    );

    await expect(
      servicio.crear(
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
    const auditor = crearAuditor(db);
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: () => repositorio.listarUsuarios(db),
        obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
        obtenerUsuarioPorEmail: (email) =>
          repositorio.obtenerUsuarioPorEmail(db, email),
        crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
        actualizarPassword: (id, pwHash) =>
          repositorio.actualizarPassword(db, id, pwHash),
        cambiarEstadoUsuario: (id, activo) =>
          repositorio.cambiarEstadoUsuario(db, id, activo),
      },
      auditor
    );

    const usuarioId = idsUsuarioCrear[0];
    const desactivado = await servicio.cambiarEstado(usuarioId, false, sesionAdminPais);
    expect(desactivado.activo).toBe(false);

    const activado = await servicio.cambiarEstado(usuarioId, true, sesionAdminPais);
    expect(activado.activo).toBe(true);
  });

  it("lanza NotFoundError si usuario no existe", async () => {
    const auditor = crearAuditor(db);
    const servicio = crearServicioUsuarios(
      {
        listarUsuarios: () => repositorio.listarUsuarios(db),
        obtenerUsuarioPorId: (id) => repositorio.obtenerUsuarioPorId(db, id),
        obtenerUsuarioPorEmail: (email) =>
          repositorio.obtenerUsuarioPorEmail(db, email),
        crearUsuario: (datos) => repositorio.crearUsuario(db, datos),
        actualizarPassword: (id, pwHash) =>
          repositorio.actualizarPassword(db, id, pwHash),
        cambiarEstadoUsuario: (id, activo) =>
          repositorio.cambiarEstadoUsuario(db, id, activo),
      },
      auditor
    );

    await expect(servicio.obtenerPorId(99999)).rejects.toThrow(
      "Usuario no encontrado"
    );
  });
});
