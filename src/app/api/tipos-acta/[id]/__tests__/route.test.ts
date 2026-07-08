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

describe("DELETE /api/tipos-acta/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/tipos-acta/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(401);
  });

  it("retorna 403 si no tiene permisos (nivel=4)", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
      escuelaId: 1,
    });

    const { DELETE } = await import("../route");
    const req = new Request("http://localhost/api/tipos-acta/1", {
      method: "DELETE",
    });
    const respuesta = await DELETE(req, {
      params: Promise.resolve({ id: "1" }),
    });

    expect(respuesta.status).toBe(403);
  });
});
