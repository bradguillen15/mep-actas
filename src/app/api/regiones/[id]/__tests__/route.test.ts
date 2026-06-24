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

describe("PATCH /api/regiones/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/regiones/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Actualizado" }),
    });
    const respuesta = await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    });

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

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/regiones/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Actualizado" }),
    });
    const respuesta = await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});

describe("DELETE /api/regiones/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/regiones/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

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

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/regiones/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});
