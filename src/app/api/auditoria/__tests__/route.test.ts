import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarAuditoria = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({ obtenerSesion: mockObtenerSesion }));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/repositorios/auditoria.repositorio", () => ({
  listarAuditoria: mockListarAuditoria,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockListarAuditoria.mockResolvedValue([]);
});

async function consultarComo(sesion: object | null) {
  mockObtenerSesion.mockResolvedValue(sesion);
  const { GET } = await import("../route");
  return GET(new Request("http://localhost/api/auditoria") as never);
}

describe("GET /api/auditoria", () => {
  it.each([
    [{ nivel: 4, escuelaId: 5 }, { tipo: "escuela", escuelaId: 5 }],
    [{ nivel: 3, escuelaId: 5 }, { tipo: "escuela", escuelaId: 5 }],
    [{ nivel: 2, regionId: 1 }, { tipo: "region", regionId: 1 }],
    [{ nivel: 1 }, { tipo: "pais" }],
  ])("la sesión %o consulta con el ámbito %o", async (parcial, ambito) => {
    const respuesta = await consultarComo({
      usuarioId: 9, email: "x@mep.go.cr", rolId: 1, funcionarioId: 9, ...parcial,
    });
    expect(respuesta.status).toBe(200);
    expect(mockListarAuditoria).toHaveBeenCalledWith(expect.anything(), expect.any(Object), ambito);
  });

  it("sin sesión responde 401", async () => {
    const respuesta = await consultarComo(null);
    expect(respuesta.status).toBe(401);
  });
});
