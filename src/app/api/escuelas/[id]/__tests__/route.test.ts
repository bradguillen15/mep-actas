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

describe("PATCH /api/escuelas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Actualizado" }),
    });
    const respuesta = await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no es Admin Regional (nivel=1)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "admin@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
    });

    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
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

describe("DELETE /api/escuelas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesion", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si es Staff (nivel=4)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
    });

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/escuelas/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});
