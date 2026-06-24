import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();

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
