import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";
import { obtenerAmbitoDeFuncionario } from "@/server/repositorios/usuarios.repositorio";
import {
  MENSAJE_FUERA_DE_AMBITO,
  MENSAJE_NO_AUTENTICADO,
  MENSAJE_SIN_PERMISOS,
} from "@/server/auth/autorizacion.servicio";
import {
  EMAIL_ADMIN_ESCUELA,
  EMAIL_ADMIN_PAIS,
  EMAIL_ADMIN_REGIONAL,
  EMAIL_STAFF,
  datosSesionAdminEscuela,
  datosSesionAdminPais,
  datosSesionAdminRegional,
  datosSesionStaff,
  limpiarAuditoriaDeAmbito,
  obtenerRolPorNivel,
  obtenerUsuarioPorEmail,
} from "./helpers";

const sesionActual = vi.hoisted(() => ({ valor: null as SesionUsuario | null }));

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: async () => sesionActual.valor,
}));

vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));

const db = clienteDb();

const CODIGO_ESCUELA_STAFF = "001";
const CODIGO_ESCUELA_AJENA_AL_STAFF = "002";
const CODIGO_ESCUELA_OTRA_REGION = "101";
const CONTRASENA_VALIDA = "contrasena-e2e-segura";

let sesionPais: SesionUsuario;
let sesionRegional: SesionUsuario;
let sesionAdminEscuela: SesionUsuario;
let sesionStaff: SesionUsuario;
let escuelaStaffId: number;
let escuelaAjenaId: number;
let escuelaOtraRegionId: number;
let regionDelRegionalId: number;
let rolesPorNivel: Map<number, number>;

const idsRegion: number[] = [];
const idsEscuela: number[] = [];
const idsEscaneo: number[] = [];
const idsUsuario: number[] = [];
const idsFuncionarioEscuela: number[] = [];
const idsFuncionario: number[] = [];
const idsPersona: number[] = [];

function peticionJson(url: string, metodo: string, cuerpo?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

function rolIdDeNivel(nivel: number): number {
  const rolId = rolesPorNivel.get(nivel);
  if (rolId === undefined) throw new Error(`Rol de nivel ${nivel} no sembrado`);
  return rolId;
}

async function escuelaPorCodigo(codigoMep: string) {
  const [escuela] = await db
    .select()
    .from(esquema.escuelas)
    .where(eq(esquema.escuelas.codigoMep, codigoMep));
  return escuela;
}

let contadorPersona = 0;

async function crearFuncionarioEnEscuela(escuelaId: number) {
  contadorPersona += 1;
  const [{ id: personaId }] = await db
    .insert(esquema.personas)
    .values({
      identificacion: `9100000${String(contadorPersona).padStart(3, "0")}`,
      nombres: "Func",
      apellidos: "E2E Rutas",
    })
    .returning()
    .all();
  idsPersona.push(personaId);

  const [{ id: funcionarioId }] = await db
    .insert(esquema.funcionarios)
    .values({ personaId, puesto: "Staff" })
    .returning()
    .all();
  idsFuncionario.push(funcionarioId);

  const [{ id: vinculoId }] = await db
    .insert(esquema.funcionarioEscuela)
    .values({ funcionarioId, escuelaId })
    .returning()
    .all();
  idsFuncionarioEscuela.push(vinculoId);

  return funcionarioId;
}

beforeAll(async () => {
  rolesPorNivel = new Map();
  for (const nivel of [1, 2, 3, 4]) {
    rolesPorNivel.set(nivel, (await obtenerRolPorNivel(db, nivel)).id);
  }

  escuelaStaffId = (await escuelaPorCodigo(CODIGO_ESCUELA_STAFF)).id;
  escuelaAjenaId = (await escuelaPorCodigo(CODIGO_ESCUELA_AJENA_AL_STAFF)).id;
  escuelaOtraRegionId = (await escuelaPorCodigo(CODIGO_ESCUELA_OTRA_REGION)).id;

  const pais = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_PAIS);
  sesionPais = datosSesionAdminPais(pais, rolIdDeNivel(1));

  const regional = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_REGIONAL);
  const ambitoRegional = await obtenerAmbitoDeFuncionario(db, regional.funcionarioId);
  regionDelRegionalId = ambitoRegional.regionIds[0];
  sesionRegional = datosSesionAdminRegional(regional, rolIdDeNivel(2), regionDelRegionalId);

  const adminEscuela = await obtenerUsuarioPorEmail(db, EMAIL_ADMIN_ESCUELA);
  sesionAdminEscuela = datosSesionAdminEscuela(adminEscuela, rolIdDeNivel(3), escuelaStaffId);

  const staff = await obtenerUsuarioPorEmail(db, EMAIL_STAFF);
  sesionStaff = datosSesionStaff(staff, rolIdDeNivel(4), escuelaStaffId);
});

beforeEach(() => {
  sesionActual.valor = null;
  vi.stubEnv("R2_ACCOUNT_ID", "cuenta-e2e");
  vi.stubEnv("R2_ACCESS_KEY_ID", "llave-e2e");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "secreto-e2e");
  vi.stubEnv("R2_BUCKET", "bucket-e2e");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  if (idsEscaneo.length > 0) {
    await db
      .delete(esquema.auditoria)
      .where(
        and(
          eq(esquema.auditoria.tabla, "escaneos"),
          inArray(esquema.auditoria.registroId, idsEscaneo)
        )
      );
    await db.delete(esquema.escaneos).where(inArray(esquema.escaneos.id, idsEscaneo));
  }
  if (idsUsuario.length > 0) {
    await db
      .delete(esquema.auditoria)
      .where(
        and(
          eq(esquema.auditoria.tabla, "usuarios"),
          inArray(esquema.auditoria.registroId, idsUsuario)
        )
      );
    await db.delete(esquema.usuarios).where(inArray(esquema.usuarios.id, idsUsuario));
  }
  if (idsFuncionarioEscuela.length > 0) {
    await db
      .delete(esquema.funcionarioEscuela)
      .where(inArray(esquema.funcionarioEscuela.id, idsFuncionarioEscuela));
  }
  if (idsFuncionario.length > 0) {
    await db.delete(esquema.funcionarios).where(inArray(esquema.funcionarios.id, idsFuncionario));
  }
  if (idsPersona.length > 0) {
    await db.delete(esquema.personas).where(inArray(esquema.personas.id, idsPersona));
  }
  await limpiarAuditoriaDeAmbito(db, idsEscuela, idsRegion);
  if (idsEscuela.length > 0) {
    await db.delete(esquema.escuelas).where(inArray(esquema.escuelas.id, idsEscuela));
  }
  if (idsRegion.length > 0) {
    await db.delete(esquema.regiones).where(inArray(esquema.regiones.id, idsRegion));
  }
});

describe("API de regiones", () => {
  it("Admin País crea una región", async () => {
    const { POST } = await import("@/app/api/regiones/route");
    sesionActual.valor = sesionPais;

    const respuesta = await POST(peticionJson("/api/regiones", "POST", { nombre: "E2E Región API" }));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.nombre).toBe("E2E Región API");
    idsRegion.push(cuerpo.id);
  });

  it("Admin Regional no puede crear una región y recibe un mensaje legible", async () => {
    const { POST } = await import("@/app/api/regiones/route");
    sesionActual.valor = sesionRegional;

    const respuesta = await POST(peticionJson("/api/regiones", "POST", { nombre: "E2E Región Prohibida" }));

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "No tiene permisos para crear regiones" });
  });
});

describe("API de escuelas", () => {
  it("Admin País crea una escuela en cualquier región", async () => {
    const { POST } = await import("@/app/api/escuelas/route");
    sesionActual.valor = sesionPais;

    const respuesta = await POST(
      peticionJson("/api/escuelas", "POST", {
        regionId: idsRegion[0],
        codigoMep: "E2E-API-001",
        nombre: "E2E Escuela País",
      })
    );
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.regionId).toBe(idsRegion[0]);
    idsEscuela.push(cuerpo.id);
  });

  it("Admin Regional crea una escuela solo en su propia región", async () => {
    const { POST } = await import("@/app/api/escuelas/route");
    sesionActual.valor = sesionRegional;

    const respuesta = await POST(
      peticionJson("/api/escuelas", "POST", {
        regionId: regionDelRegionalId,
        codigoMep: "E2E-API-002",
        nombre: "E2E Escuela Regional",
      })
    );
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.regionId).toBe(regionDelRegionalId);
    idsEscuela.push(cuerpo.id);
  });

  it("Admin Regional recibe 403 con mensaje legible al crear en otra región", async () => {
    const { POST } = await import("@/app/api/escuelas/route");
    sesionActual.valor = sesionRegional;

    const respuesta = await POST(
      peticionJson("/api/escuelas", "POST", {
        regionId: idsRegion[0],
        codigoMep: "E2E-API-003",
        nombre: "E2E Escuela Ajena",
      })
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para crear escuelas en esta región",
    });
  });

  it("Admin Regional recibe 403 con mensaje legible al modificar y desactivar una escuela de otra región", async () => {
    const { PATCH, DELETE } = await import("@/app/api/escuelas/[id]/route");
    sesionActual.valor = sesionRegional;
    const contexto = { params: Promise.resolve({ id: String(idsEscuela[0]) }) };

    const modificada = await PATCH(
      peticionJson(`/api/escuelas/${idsEscuela[0]}`, "PATCH", { nombre: "Intento ajeno" }),
      contexto
    );
    expect(modificada.status).toBe(403);
    expect(await modificada.json()).toEqual({
      error: "No tiene permisos para modificar esta escuela",
    });

    const desactivada = await DELETE(
      peticionJson(`/api/escuelas/${idsEscuela[0]}`, "DELETE"),
      contexto
    );
    expect(desactivada.status).toBe(403);
    expect(await desactivada.json()).toEqual({
      error: "No tiene permisos para desactivar esta escuela",
    });
  });

  it("los errores de validación siguen siendo 400", async () => {
    const { POST } = await import("@/app/api/escuelas/route");
    sesionActual.valor = sesionPais;

    const respuesta = await POST(
      peticionJson("/api/escuelas", "POST", { regionId: idsRegion[0], codigoMep: " ", nombre: "X" })
    );

    expect(respuesta.status).toBe(400);
  });
});

describe("API de escaneos", () => {
  async function listar(sesion: SesionUsuario, consulta = "") {
    const { GET } = await import("@/app/api/escaneos/route");
    sesionActual.valor = sesion;
    return GET(new NextRequest(`http://localhost/api/escaneos${consulta}`));
  }

  it.each([
    ["Admin País", () => sesionPais],
    ["Admin Regional", () => sesionRegional],
  ])("%s sin escuelaId recibe 400 con mensaje legible", async (_nombre, obtenerSesion) => {
    const respuesta = await listar(obtenerSesion());

    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error).toMatch(/Debe indicar la escuela/);
  });

  it("Admin País con escuelaId lista solo los folios de esa escuela", async () => {
    const respuesta = await listar(sesionPais, `?escuelaId=${escuelaStaffId}`);
    const escaneos: { escuelaId: number }[] = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(escaneos.length).toBeGreaterThan(0);
    expect(escaneos.every((e) => e.escuelaId === escuelaStaffId)).toBe(true);
  });

  it("Admin Regional lista solo los folios de una escuela de su región", async () => {
    const respuesta = await listar(sesionRegional, `?escuelaId=${escuelaAjenaId}`);
    const escaneos: { escuelaId: number }[] = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(escaneos.length).toBeGreaterThan(0);
    expect(escaneos.every((e) => e.escuelaId === escuelaAjenaId)).toBe(true);
  });

  it("Admin Regional no obtiene folios de una escuela de otra región", async () => {
    const respuesta = await listar(sesionRegional, `?escuelaId=${escuelaOtraRegionId}`);

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([]);
  });

  it("Staff lista los folios de su propia escuela", async () => {
    const respuesta = await listar(sesionStaff);
    const escaneos: { escuelaId: number }[] = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(escaneos.length).toBeGreaterThan(0);
    expect(escaneos.every((e) => e.escuelaId === escuelaStaffId)).toBe(true);
  });

  it("Staff prepara una subida en su propia escuela", async () => {
    const { POST } = await import("@/app/api/escaneos/route");
    sesionActual.valor = sesionStaff;

    const respuesta = await POST(
      peticionJson("/api/escaneos", "POST", {
        escuelaId: escuelaStaffId,
        numeroTomo: 9001,
        numeroFolio: 1,
        formato: "png",
      })
    );
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.clave).toBe(`escaneos/${escuelaStaffId}/9001/1.png`);
    expect(cuerpo.urlSubida).toContain(cuerpo.clave);
    idsEscaneo.push(cuerpo.escaneo.id);
  });

  it("Staff recibe 403 con mensaje legible al preparar una subida en otra escuela", async () => {
    const { POST } = await import("@/app/api/escaneos/route");
    sesionActual.valor = sesionStaff;

    const respuesta = await POST(
      peticionJson("/api/escaneos", "POST", {
        escuelaId: escuelaAjenaId,
        numeroTomo: 9001,
        numeroFolio: 2,
        formato: "png",
      })
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: MENSAJE_FUERA_DE_AMBITO });
  });
});

describe("API de usuarios", () => {
  async function crear(sesion: SesionUsuario, cuerpo: Record<string, unknown>) {
    const { POST } = await import("@/app/api/usuarios/route");
    sesionActual.valor = sesion;
    return POST(peticionJson("/api/usuarios", "POST", { password: CONTRASENA_VALIDA, ...cuerpo }));
  }

  it("Admin País crea un usuario con funcionarioId y rolId de cualquier nivel", async () => {
    const funcionarioId = await crearFuncionarioEnEscuela(escuelaOtraRegionId);

    const respuesta = await crear(sesionPais, {
      funcionarioId,
      rolId: rolIdDeNivel(2),
      email: "e2e-api-pais@e2e.test",
    });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.funcionarioId).toBe(funcionarioId);
    expect(cuerpo.rolId).toBe(rolIdDeNivel(2));
    idsUsuario.push(cuerpo.id);
  });

  it("Admin Escuela crea un Staff de su escuela", async () => {
    const funcionarioId = await crearFuncionarioEnEscuela(escuelaStaffId);

    const respuesta = await crear(sesionAdminEscuela, {
      funcionarioId,
      rolId: rolIdDeNivel(4),
      email: "e2e-api-staff@e2e.test",
    });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(201);
    expect(cuerpo.rolId).toBe(rolIdDeNivel(4));
    idsUsuario.push(cuerpo.id);
  });

  it("Admin Escuela no puede asignar un rol superior al suyo", async () => {
    const funcionarioId = await crearFuncionarioEnEscuela(escuelaStaffId);

    const respuesta = await crear(sesionAdminEscuela, {
      funcionarioId,
      rolId: rolIdDeNivel(1),
      email: "e2e-api-escalada@e2e.test",
    });

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para gestionar este usuario",
    });
  });

  it("Admin Escuela no puede crear usuarios para funcionarios de otra escuela", async () => {
    const funcionarioId = await crearFuncionarioEnEscuela(escuelaAjenaId);

    const respuesta = await crear(sesionAdminEscuela, {
      funcionarioId,
      rolId: rolIdDeNivel(4),
      email: "e2e-api-ajeno@e2e.test",
    });

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para gestionar este usuario",
    });
  });
});

describe("Mensajes legibles de 401 y 403 por dominio", () => {
  it("responde 401 con 'No autorizado' en las rutas de cada dominio", async () => {
    const rutas = await Promise.all([
      import("@/app/api/regiones/route"),
      import("@/app/api/escuelas/route"),
      import("@/app/api/escaneos/route"),
      import("@/app/api/usuarios/route"),
      import("@/app/api/auditoria/route"),
      import("@/app/api/actas/route"),
      import("@/app/api/personas/route"),
      import("@/app/api/funcionarios/route"),
    ]);
    sesionActual.valor = null;

    for (const ruta of rutas) {
      const respuesta = await (ruta.GET as (peticion: NextRequest) => Promise<Response>)(
        new NextRequest("http://localhost/api/prueba")
      );
      expect(respuesta.status).toBe(401);
      expect(await respuesta.json()).toEqual({ error: MENSAJE_NO_AUTENTICADO });
    }
  });

  it("Staff recibe 403 con mensaje legible en usuarios y funcionarios", async () => {
    sesionActual.valor = sesionStaff;
    const usuarios = await import("@/app/api/usuarios/route");
    const funcionarios = await import("@/app/api/funcionarios/route");

    const respuestaUsuarios = await usuarios.GET();
    const respuestaFuncionarios = await funcionarios.POST(
      peticionJson("/api/funcionarios", "POST", {})
    );

    expect(respuestaUsuarios.status).toBe(403);
    expect(await respuestaUsuarios.json()).toEqual({ error: MENSAJE_SIN_PERMISOS });
    expect(respuestaFuncionarios.status).toBe(403);
    expect(await respuestaFuncionarios.json()).toEqual({ error: MENSAJE_SIN_PERMISOS });
  });
});
