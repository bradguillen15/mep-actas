import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockEliminarEscaneo = vi.fn();
const mockObtenerEscaneoPorId = vi.fn();
const mockGenerarUrlLectura = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));

vi.mock("next-auth", () => ({
  default: () => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/db/cliente", () => ({
  clienteDb: () => ({}),
}));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => vi.fn(),
}));

vi.mock("@/server/almacenamiento/r2.util", () => ({
  construirClave: vi.fn(),
  generarUrlSubida: vi.fn(),
  generarUrlLectura: mockGenerarUrlLectura,
}));

vi.mock("@/server/repositorios/escaneos.repositorio", () => ({
  listarEscaneos: vi.fn(),
  obtenerEscaneoPorId: mockObtenerEscaneoPorId,
  crearEscaneo: vi.fn(),
  eliminarEscaneo: mockEliminarEscaneo,
}));

describe("DELETE /api/escaneos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escaneos/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req as never, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si el nivel es Staff (4)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
      escuelaId: 1,
    });

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escaneos/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req as never, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
    expect(mockEliminarEscaneo).not.toHaveBeenCalled();
  });

  it("retorna 404 si Admin Escuela intenta eliminar un escaneo de otra escuela", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "escuela@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
      escuelaId: 1,
    });
    mockObtenerEscaneoPorId.mockResolvedValue(undefined);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escaneos/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req as never, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Escaneo no encontrado" });
    expect(mockObtenerEscaneoPorId).toHaveBeenCalledWith(expect.anything(), 1, {
      tipo: "escuela",
      escuelaId: 1,
    });
    expect(mockEliminarEscaneo).not.toHaveBeenCalled();
  });
});

describe("GET /api/escaneos/[id]", () => {
  const escaneo = {
    id: 1,
    escuelaId: 1,
    numeroTomo: 1,
    numeroFolio: 1,
    url: "escaneos/1/1/1.jpg",
    formato: "jpg",
    uploadedBy: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerarUrlLectura.mockResolvedValue("https://r2.example/firmada");
  });

  async function consultarComo(sesion: object) {
    mockObtenerSesion.mockResolvedValue(sesion);
    const { GET } = await import("../route");
    return GET(new Request("http://localhost/api/escaneos/1") as never, {
      params: Promise.resolve({ id: "1" }),
    });
  }

  it("responde 404 sin firmar URL si el escaneo está fuera del ámbito", async () => {
    mockObtenerEscaneoPorId.mockResolvedValue(undefined);
    const respuesta = await consultarComo({
      usuarioId: 4, email: "s@mep.go.cr", nivel: 4, rolId: 4, funcionarioId: 4, escuelaId: 2,
    });
    expect(respuesta.status).toBe(404);
    expect(mockGenerarUrlLectura).not.toHaveBeenCalled();
  });

  it("devuelve la URL firmada si el escaneo está en el ámbito", async () => {
    mockObtenerEscaneoPorId.mockResolvedValue(escaneo);
    const respuesta = await consultarComo({
      usuarioId: 4, email: "s@mep.go.cr", nivel: 4, rolId: 4, funcionarioId: 4, escuelaId: 1,
    });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ urlLectura: "https://r2.example/firmada" });
  });

  it("consulta con el ámbito regional del Admin Regional", async () => {
    mockObtenerEscaneoPorId.mockResolvedValue(undefined);
    await consultarComo({
      usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 3,
    });
    expect(mockObtenerEscaneoPorId).toHaveBeenCalledWith(expect.anything(), 1, {
      tipo: "region",
      regionId: 3,
    });
  });
});
