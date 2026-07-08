import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockCrearEscaneo = vi.fn();

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
  construirClave: () => "escaneos/5/1/1.jpg",
  generarUrlSubida: async () => "https://r2.example/subida-firmada",
  generarUrlLectura: async () => "https://r2.example/lectura-firmada",
}));

vi.mock("@/server/repositorios/escaneos.repositorio", () => ({
  listarEscaneos: vi.fn(),
  obtenerEscaneoPorId: vi.fn(),
  crearEscaneo: mockCrearEscaneo,
  eliminarEscaneo: vi.fn(),
}));

function sesionStaff() {
  return {
    usuarioId: 4,
    email: "staff@escuela.go.cr",
    nivel: 4,
    rolId: 4,
    funcionarioId: 4,
    escuelaId: 5,
  };
}

function sesionAdminEscuela() {
  return {
    usuarioId: 3,
    email: "escuela@mep.go.cr",
    nivel: 3,
    rolId: 3,
    funcionarioId: 3,
    escuelaId: 5,
  };
}

function sesionAdminRegional() {
  return {
    usuarioId: 2,
    email: "regional@mep.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 1,
  };
}

function sesionAdminPais() {
  return {
    usuarioId: 1,
    email: "pais@mep.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };
}

describe("POST /api/escaneos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrearEscaneo.mockResolvedValue({
      id: 1,
      escuelaId: 5,
      numeroTomo: 1,
      numeroFolio: 1,
      url: "escaneos/5/1/1.jpg",
      formato: "jpg",
      uploadedBy: 4,
    });
  });

  it("permite a Staff (nivel 4) preparar subida en su propia escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 5,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
    expect(mockCrearEscaneo).toHaveBeenCalled();
  });

  it("deniega a Staff preparar subida en otra escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 10,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(mockCrearEscaneo).not.toHaveBeenCalled();
  });

  it("Admin Escuela (nivel 3) sigue pudiendo preparar subida en su propia escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminEscuela());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 5,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });

  it("Admin Regional (nivel 2) sigue sin restricción de escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 999,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });

  it("Admin País (nivel 1) sigue sin restricción de escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminPais());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escaneos", {
      method: "POST",
      body: JSON.stringify({
        escuelaId: 999,
        numeroTomo: 1,
        numeroFolio: 1,
        formato: "jpg",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });
});
