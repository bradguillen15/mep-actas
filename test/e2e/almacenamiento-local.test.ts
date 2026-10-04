import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { clienteDb } from "@/db/cliente";
import * as esquema from "@/db/esquema";
import type { SesionUsuario } from "@/server/auth/tipos";
import {
  crearAlmacenamientoLocal,
  escribirArchivoLocal,
  leerArchivoLocal,
} from "@/server/almacenamiento/local";
import {
  crearAlmacenamientoEscaneos,
  modoLocalActivo,
} from "@/server/almacenamiento/seleccion";
import {
  EMAIL_STAFF,
  datosSesionStaff,
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
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

let directorioBase: string;
let escuelaStaffId: number;
let escuelaAjenaId: number;
let sesionStaff: SesionUsuario;

async function escuelaPorCodigo(codigoMep: string) {
  const [escuela] = await db
    .select()
    .from(esquema.escuelas)
    .where(eq(esquema.escuelas.codigoMep, codigoMep));
  return escuela;
}

beforeAll(async () => {
  escuelaStaffId = (await escuelaPorCodigo("001")).id;
  escuelaAjenaId = (await escuelaPorCodigo("002")).id;
  const staff = await obtenerUsuarioPorEmail(db, EMAIL_STAFF);
  sesionStaff = datosSesionStaff(staff, (await obtenerRolPorNivel(db, 4)).id, escuelaStaffId);
});

beforeEach(() => {
  directorioBase = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-almacenamiento-"));
  sesionActual.valor = sesionStaff;
  vi.stubEnv("ALMACENAMIENTO_LOCAL_DIR", directorioBase);
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(directorioBase, { recursive: true, force: true });
});

describe("Adaptador de almacenamiento local", () => {
  it("escribe un archivo y lo lee de vuelta con su tipo de contenido", async () => {
    const clave = `escaneos/${escuelaStaffId}/1/1.png`;

    await escribirArchivoLocal(directorioBase, clave, PNG);
    const archivo = await leerArchivoLocal(directorioBase, clave);

    expect(archivo?.contenido.equals(PNG)).toBe(true);
    expect(archivo?.tipoContenido).toBe("image/png");
  });

  it("genera URLs de lectura y subida que apuntan a la ruta local de la aplicación", async () => {
    const clave = `escaneos/${escuelaStaffId}/1/1.png`;
    const almacenamiento = crearAlmacenamientoLocal();

    expect(await almacenamiento.generarUrlLectura(clave)).toBe(`/api/almacenamiento-local/${clave}`);
    expect(await almacenamiento.generarUrlSubida(clave, "image/png")).toBe(
      `/api/almacenamiento-local/${clave}`
    );
  });
});

describe("Selección del almacenamiento por entorno", () => {
  it("en desarrollo sin R2 usa el adaptador local", async () => {
    const entorno = { NODE_ENV: "development" };

    expect(modoLocalActivo(entorno)).toBe(true);
    expect(
      await crearAlmacenamientoEscaneos(entorno).generarUrlLectura("escaneos/1/1/1.png")
    ).toBe("/api/almacenamiento-local/escaneos/1/1/1.png");
  });

  it("en producción sin R2 falla por las variables de entorno faltantes", async () => {
    const entorno = { NODE_ENV: "production" };
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");

    expect(modoLocalActivo(entorno)).toBe(false);
    await expect(
      crearAlmacenamientoEscaneos(entorno).generarUrlLectura("escaneos/1/1/1.png")
    ).rejects.toThrow(/Faltan variables de entorno para Cloudflare R2/);
  });
});

describe("Ruta /api/almacenamiento-local con la base sembrada", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("R2_ACCOUNT_ID", "");
    vi.stubEnv("R2_ACCESS_KEY_ID", "");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
  });

  function parametros(clave: string) {
    return { params: Promise.resolve({ clave: clave.split("/") }) };
  }

  it("Staff sube y lee un folio de su propia escuela", async () => {
    const { GET, PUT } = await import("@/app/api/almacenamiento-local/[...clave]/route");
    const clave = `escaneos/${escuelaStaffId}/9001/1.png`;

    const subida = await PUT(
      new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`, {
        method: "PUT",
        body: new Uint8Array(PNG),
        headers: { "Content-Type": "image/png" },
      }),
      parametros(clave)
    );
    const lectura = await GET(
      new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`),
      parametros(clave)
    );

    expect(subida.status).toBe(204);
    expect(lectura.status).toBe(200);
    expect(lectura.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await lectura.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it("Staff recibe 403 al leer un folio de otra escuela", async () => {
    const { GET } = await import("@/app/api/almacenamiento-local/[...clave]/route");
    const clave = `escaneos/${escuelaAjenaId}/9001/1.png`;

    const respuesta = await GET(
      new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`),
      parametros(clave)
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "No tiene permisos sobre este escaneo" });
  });

  it("responde 401 legible sin sesión", async () => {
    const { GET } = await import("@/app/api/almacenamiento-local/[...clave]/route");
    sesionActual.valor = null;
    const clave = `escaneos/${escuelaStaffId}/9001/1.png`;

    const respuesta = await GET(
      new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`),
      parametros(clave)
    );

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autorizado" });
  });
});
