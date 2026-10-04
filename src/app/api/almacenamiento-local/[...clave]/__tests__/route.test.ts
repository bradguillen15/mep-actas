/* eslint-disable security/detect-non-literal-fs-filename -- directorio temporal de la prueba */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

const mockObtenerSesion = vi.hoisted(() => vi.fn());
const mockResolverAmbitoDeEscuela = vi.hoisted(() => vi.fn());

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));

vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/repositorios/escuelas.repositorio", () => ({
  resolverAmbitoDeEscuela: mockResolverAmbitoDeEscuela,
}));

import { GET, PUT } from "../route";

const CLAVE = "escaneos/5/3/12.png";
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const adminPais = { usuarioId: 1, email: "p@mep.go.cr", rolId: 1, nivel: 1, funcionarioId: 1 };
const personalEscuela5 = { usuarioId: 4, email: "s@mep.go.cr", rolId: 4, nivel: 4, funcionarioId: 4, escuelaId: 5 };

let directorioBase: string;

function parametros(clave: string) {
  return { params: Promise.resolve({ clave: clave.split("/") }) };
}

function peticionPut(clave: string, cuerpo: Buffer, tipo = "image/png") {
  return new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`, {
    method: "PUT",
    body: new Uint8Array(cuerpo),
    headers: { "Content-Type": tipo },
  });
}

function peticionGet(clave: string) {
  return new NextRequest(`http://localhost/api/almacenamiento-local/${clave}`);
}

beforeEach(() => {
  directorioBase = fs.mkdtempSync(path.join(os.tmpdir(), "ruta-local-"));
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ALMACENAMIENTO_LOCAL_DIR", directorioBase);
  vi.stubEnv("R2_ACCOUNT_ID", "");
  vi.stubEnv("R2_ACCESS_KEY_ID", "");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
  mockObtenerSesion.mockReset().mockResolvedValue(adminPais);
  mockResolverAmbitoDeEscuela.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(directorioBase, { recursive: true, force: true });
});

describe("almacenamiento local", () => {
  it("escribe con PUT y lee con GET el mismo contenido y tipo", async () => {
    const respuestaPut = await PUT(peticionPut(CLAVE, PNG), parametros(CLAVE));
    expect(respuestaPut.status).toBe(204);

    const respuestaGet = await GET(peticionGet(CLAVE), parametros(CLAVE));
    expect(respuestaGet.status).toBe(200);
    expect(respuestaGet.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await respuestaGet.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it("GET responde 404 si el archivo no existe", async () => {
    const respuesta = await GET(peticionGet(CLAVE), parametros(CLAVE));
    expect(respuesta.status).toBe(404);
  });

  it.each([
    ["../secreto.png"],
    ["escaneos/../../secreto.png"],
    ["escaneos/5/3/12.exe"],
  ])("rechaza la clave %s con 400", async (clave) => {
    expect((await GET(peticionGet(clave), parametros(clave))).status).toBe(400);
    expect((await PUT(peticionPut(clave, PNG), parametros(clave))).status).toBe(400);
    expect(fs.readdirSync(directorioBase)).toEqual([]);
  });

  it("responde 404 fuera de desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await GET(peticionGet(CLAVE), parametros(CLAVE))).status).toBe(404);
    expect((await PUT(peticionPut(CLAVE, PNG), parametros(CLAVE))).status).toBe(404);
    expect(fs.readdirSync(directorioBase)).toEqual([]);
  });

  it("responde 404 en desarrollo si R2 está configurado", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "cuenta");
    vi.stubEnv("R2_ACCESS_KEY_ID", "llave");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secreto");
    expect((await GET(peticionGet(CLAVE), parametros(CLAVE))).status).toBe(404);
  });

  it("responde 401 sin sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    expect((await GET(peticionGet(CLAVE), parametros(CLAVE))).status).toBe(401);
    expect((await PUT(peticionPut(CLAVE, PNG), parametros(CLAVE))).status).toBe(401);
  });

  it("responde 403 si la escuela de la clave está fuera del ámbito", async () => {
    mockObtenerSesion.mockResolvedValue({ ...personalEscuela5, escuelaId: 9 });
    expect((await GET(peticionGet(CLAVE), parametros(CLAVE))).status).toBe(403);
    expect((await PUT(peticionPut(CLAVE, PNG), parametros(CLAVE))).status).toBe(403);
  });

  it("permite a la escuela de la clave", async () => {
    mockObtenerSesion.mockResolvedValue(personalEscuela5);
    expect((await PUT(peticionPut(CLAVE, PNG), parametros(CLAVE))).status).toBe(204);
  });

  it("PUT rechaza tipos de contenido no permitidos con 415", async () => {
    const respuesta = await PUT(
      peticionPut(CLAVE, PNG, "text/html"),
      parametros(CLAVE)
    );
    expect(respuesta.status).toBe(415);
  });

  it("PUT rechaza cuerpos que superan el límite con 413", async () => {
    const grande = Buffer.alloc(10 * 1024 * 1024 + 1);
    const respuesta = await PUT(peticionPut(CLAVE, grande), parametros(CLAVE));
    expect(respuesta.status).toBe(413);
    expect(fs.readdirSync(directorioBase)).toEqual([]);
  });
});
