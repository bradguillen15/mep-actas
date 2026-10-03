import { describe, it, expect, vi, beforeEach } from "vitest";

import { ErrorProhibido } from "@/server/errores";

const mockObtenerSesion = vi.fn();
const mockCrearEscuela = vi.fn();

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => vi.fn(),
}));

vi.mock("@/server/servicios/escuelas.servicio", () => ({
  crearServicioEscuelas: () => ({
    listarEscuelas: vi.fn(),
    crearEscuela: mockCrearEscuela,
  }),
}));

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

describe("GET /api/escuelas", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { GET } = await import("../route");
    const req = new Request("http://localhost/api/escuelas");
    const respuesta = await GET(req);

    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/escuelas", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escuelas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
      }),
    });
    const respuesta = await POST(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si es Admin Escuela (nivel=3)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "admin@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
      escuelaId: 10,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/escuelas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
      }),
    });
    const respuesta = await POST(req);
    expect(respuesta.status).toBe(403);
  });
});

describe("POST /api/escuelas ante errores del servicio", () => {
  const sesionRegional = {
    usuarioId: 2,
    email: "regional@mep.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 1,
  };

  function peticion() {
    return new Request("http://localhost/api/escuelas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionId: 9, codigoMep: "MEP-009", nombre: "Escuela" }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionRegional);
  });

  it("retorna 403 con el mensaje legible cuando el servicio lanza ErrorProhibido", async () => {
    mockCrearEscuela.mockRejectedValue(
      new ErrorProhibido("No tiene permisos para crear escuelas en esta región")
    );

    const { POST } = await import("../route");
    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para crear escuelas en esta región",
    });
  });

  it("mantiene 400 para errores de validación del servicio", async () => {
    mockCrearEscuela.mockRejectedValue(new Error("El código MEP no puede estar vacío"));

    const { POST } = await import("../route");
    const respuesta = await POST(peticion());

    expect(respuesta.status).toBe(400);
  });
});
