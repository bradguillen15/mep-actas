import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import { eq } from "drizzle-orm";
import * as esquema from "@/db/esquema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { SesionUsuario } from "@/server/auth/tipos";
import { crearServicioUsuariosDesdeDb } from "@/server/servicios/usuarios.fabrica";
import {
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
  datosSesionAdminPais,
  datosSesionAdminRegional,
  datosSesionAdminEscuela,
  datosSesionStaff,
  limpiarAuditoriaDeAmbito,
  EMAIL_ADMIN_PAIS,
  EMAIL_ADMIN_REGIONAL,
  EMAIL_ADMIN_ESCUELA,
  EMAIL_STAFF,
} from "./helpers";

const DB_PATH = path.resolve(__dirname, "../../temp-e2e.db");
let db: LibSQLDatabase<typeof esquema>;

let sesionAdminPais: SesionUsuario;
let sesionAdminRegional: SesionUsuario;
let sesionAdminEscuela: SesionUsuario;
let sesionStaff: SesionUsuario;

let regionPropiaId: number;
let regionAjenaId: number;
let escuelaPropiaId: number;
let escuelaAjenaId: number;

const rolesPorNivel = new Map<number, number>();

const idsUsuarioCrear: number[] = [];
const idsPersonaCrear: number[] = [];
const idsFuncionarioCrear: number[] = [];
const idsEscuelaCrear: number[] = [];
const idsRegionCrear: number[] = [];
const idsFuncionarioEscuelaCrear: number[] = [];

function crearServicio() {
  return crearServicioUsuariosDesdeDb(db);
}

let contadorBrd = 0;

async function crearEscuela(regionId: number) {
  contadorBrd += 1;
  const [{ id }] = await db
    .insert(esquema.escuelas)
    .values({
      regionId,
      codigoMep: `brd-${contadorBrd}`,
      nombre: "Escuela Conformidad BRD",
    })
    .returning()
    .all();
  idsEscuelaCrear.push(id);
  return id;
}

async function crearFuncionarioEnEscuela(escuelaId: number) {
  contadorBrd += 1;
  const [{ id: personaId }] = await db
    .insert(esquema.personas)
    .values({
      identificacion: String(820000000 + contadorBrd),
      nombres: "Persona",
      apellidos: "Conformidad BRD",
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

  return funcionarioId;
}

async function crearComo(
  sesion: SesionUsuario,
  nivelDestino: number,
  escuelaDestinoId: number,
  email: string
) {
  const funcionarioId = await crearFuncionarioEnEscuela(escuelaDestinoId);
  const usuario = await crearServicio().crear(
    {
      funcionarioId,
      rolId: rolesPorNivel.get(nivelDestino)!,
      email,
      passwordHash: "fakehash",
    },
    sesion
  );
  idsUsuarioCrear.push(usuario.id);
  return usuario;
}

async function esperarDenegado(
  sesion: SesionUsuario,
  nivelDestino: number,
  escuelaDestinoId: number,
  email: string
) {
  const funcionarioId = await crearFuncionarioEnEscuela(escuelaDestinoId);
  await expect(
    crearServicio().crear(
      {
        funcionarioId,
        rolId: rolesPorNivel.get(nivelDestino)!,
        email,
        passwordHash: "fakehash",
      },
      sesion
    )
  ).rejects.toThrow("No tiene permisos");

  const creado = await obtenerUsuarioPorEmail(db, email);
  expect(creado).toBeUndefined();
}

beforeAll(async () => {
  const client = createClient({ url: `file:${DB_PATH}` });
  db = drizzle(client, { schema: esquema }) as LibSQLDatabase<typeof esquema>;

  for (const nivel of [1, 2, 3, 4]) {
    const rol = await obtenerRolPorNivel(db, nivel);
    rolesPorNivel.set(nivel, rol.id);
  }

  const [{ id: regionPropia }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región BRD Propia" })
    .returning()
    .all();
  regionPropiaId = regionPropia;
  idsRegionCrear.push(regionPropia);

  const [{ id: regionAjena }] = await db
    .insert(esquema.regiones)
    .values({ nombre: "Región BRD Ajena" })
    .returning()
    .all();
  regionAjenaId = regionAjena;
  idsRegionCrear.push(regionAjena);

  escuelaPropiaId = await crearEscuela(regionPropiaId);
  escuelaAjenaId = await crearEscuela(regionAjenaId);

  const adminPais = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  const adminRegional = await obtenerUsuarioPorEmail(
    db,
    EMAIL_ADMIN_REGIONAL
  );
  const adminEscuela = await obtenerUsuarioPorEmail(
    db,
    EMAIL_ADMIN_ESCUELA
  );
  const staff = await obtenerUsuarioPorEmail(db, EMAIL_STAFF);

  sesionAdminPais = datosSesionAdminPais(adminPais, rolesPorNivel.get(1)!);
  sesionAdminRegional = datosSesionAdminRegional(
    adminRegional,
    rolesPorNivel.get(2)!,
    regionPropiaId
  );
  sesionAdminEscuela = datosSesionAdminEscuela(
    adminEscuela,
    rolesPorNivel.get(3)!,
    escuelaPropiaId
  );
  sesionStaff = datosSesionStaff(
    staff,
    rolesPorNivel.get(4)!,
    escuelaPropiaId
  );
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
  await limpiarAuditoriaDeAmbito(db, idsEscuelaCrear, idsRegionCrear);
  for (const id of idsEscuelaCrear) {
    await db.delete(esquema.escuelas).where(eq(esquema.escuelas.id, id));
  }
  for (const id of idsRegionCrear) {
    await db.delete(esquema.regiones).where(eq(esquema.regiones.id, id));
  }
});

describe("Conformidad BRD §6 — cada nivel crea usuarios de su mismo nivel o inferiores", () => {
  it.each([1, 2, 3, 4])(
    "Admin País (nivel 1) crea usuarios de nivel %i",
    async (nivelDestino) => {
      const usuario = await crearComo(
        sesionAdminPais,
        nivelDestino,
        escuelaPropiaId,
        `brd-pais-crea-n${nivelDestino}@e2e.test`
      );
      expect(usuario.id).toBeGreaterThan(0);
    }
  );

  it("Admin Regional (nivel 2) no crea Admin País (nivel 1)", async () => {
    await esperarDenegado(
      sesionAdminRegional,
      1,
      escuelaPropiaId,
      "brd-regional-crea-n1@e2e.test"
    );
  });

  it.each([2, 3, 4])(
    "Admin Regional (nivel 2) crea usuarios de nivel %i dentro de su región",
    async (nivelDestino) => {
      const usuario = await crearComo(
        sesionAdminRegional,
        nivelDestino,
        escuelaPropiaId,
        `brd-regional-crea-n${nivelDestino}@e2e.test`
      );
      expect(usuario.id).toBeGreaterThan(0);
    }
  );

  it.each([1, 2])(
    "Admin Escuela (nivel 3) no crea usuarios de nivel %i",
    async (nivelDestino) => {
      await esperarDenegado(
        sesionAdminEscuela,
        nivelDestino,
        escuelaPropiaId,
        `brd-escuela-crea-n${nivelDestino}@e2e.test`
      );
    }
  );

  it.each([3, 4])(
    "Admin Escuela (nivel 3) crea usuarios de nivel %i de su escuela",
    async (nivelDestino) => {
      const usuario = await crearComo(
        sesionAdminEscuela,
        nivelDestino,
        escuelaPropiaId,
        `brd-escuela-crea-n${nivelDestino}@e2e.test`
      );
      expect(usuario.id).toBeGreaterThan(0);
    }
  );

  it.each([1, 2, 3, 4])(
    "Staff (nivel 4) no crea usuarios de nivel %i",
    async (nivelDestino) => {
      await esperarDenegado(
        sesionStaff,
        nivelDestino,
        escuelaPropiaId,
        `brd-staff-crea-n${nivelDestino}@e2e.test`
      );
    }
  );
});

describe("Conformidad BRD §6 — gestión limitada al ámbito propio", () => {
  it("Admin Regional no crea usuarios de otra región", async () => {
    await esperarDenegado(
      sesionAdminRegional,
      4,
      escuelaAjenaId,
      "brd-regional-fuera-region@e2e.test"
    );
  });

  it("Admin Escuela no crea usuarios de otra escuela", async () => {
    await esperarDenegado(
      sesionAdminEscuela,
      4,
      escuelaAjenaId,
      "brd-escuela-fuera-escuela@e2e.test"
    );
  });

  it("Staff no restablece contraseñas ni cambia el estado de usuarios", async () => {
    const objetivo = await crearComo(
      sesionAdminPais,
      4,
      escuelaPropiaId,
      "brd-objetivo-staff@e2e.test"
    );

    await expect(
      crearServicio().actualizarPassword(objetivo.id, "otrohash", sesionStaff)
    ).rejects.toThrow("No tiene permisos");

    await expect(
      crearServicio().cambiarEstado(objetivo.id, false, sesionStaff)
    ).rejects.toThrow("No tiene permisos");

    const sinCambios = await obtenerUsuarioPorEmail(
      db,
      "brd-objetivo-staff@e2e.test"
    );
    expect(sinCambios.activo).toBe(true);
  });
});
