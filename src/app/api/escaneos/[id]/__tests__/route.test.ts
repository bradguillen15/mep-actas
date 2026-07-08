import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockEliminarEscaneo = vi.fn();
const mockObtenerEscaneoPorId = vi.fn();

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

  it("retorna 403 si Admin Escuela intenta eliminar un escaneo de otra escuela", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "escuela@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
      escuelaId: 1,
    });
    mockObtenerEscaneoPorId.mockResolvedValue({
      id: 1,
      escuelaId: 99,
      numeroTomo: 1,
      numeroFolio: 1,
      url: "escaneos/99/1/1.jpg",
      formato: "jpg",
      uploadedBy: 1,
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
});
