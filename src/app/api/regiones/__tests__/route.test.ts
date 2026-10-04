import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));

// Mock next-auth to avoid "next/server" resolution issue in Vitest
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));

describe("GET /api/regiones", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { GET } = await import("../route");
    const respuesta = await GET();

    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/regiones", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/regiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "San José" }),
    });
    const respuesta = await POST(req);
    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no es Admin Pais (nivel=2)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 2,
      email: "admin@region.go.cr",
      nivel: 2,
      rolId: 2,
      funcionarioId: 2,
      regionId: 1,
    });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/regiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "San José" }),
    });
    const respuesta = await POST(req);
    expect(respuesta.status).toBe(403);
  });
});
