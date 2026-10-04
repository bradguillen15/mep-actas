import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockBuscar = vi.fn();
const mockObtenerPorId = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({ obtenerSesion: mockObtenerSesion }));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/repositorios/graduaciones.repositorio", () => ({
  buscarGraduaciones: mockBuscar,
  obtenerGraduacionPorId: mockObtenerPorId,
}));

const adminEscuela = { usuarioId: 3, email: "e@mep.go.cr", nivel: 3, rolId: 3, funcionarioId: 3, escuelaId: 5 };
const adminRegional = { usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  mockBuscar.mockResolvedValue({ datos: [], total: 0, pagina: 1, limite: 20 });
  mockObtenerPorId.mockResolvedValue([]);
});

describe("GET /api/graduaciones", () => {
  it("busca con el ámbito de la escuela del actor", async () => {
    mockObtenerSesion.mockResolvedValue(adminEscuela);
    const { GET } = await import("../route");
    const respuesta = await GET(
      new Request("http://localhost/api/graduaciones?identificacion=1") as never
    );
    expect(respuesta.status).toBe(200);
    expect(mockBuscar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ identificacion: "1" }),
      { tipo: "escuela", escuelaId: 5 }
    );
  });

  it("sin coincidencias en el ámbito responde 200 vacío", async () => {
    mockObtenerSesion.mockResolvedValue(adminRegional);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/graduaciones?nombre=x") as never);
    expect(await respuesta.json()).toEqual({ datos: [], total: 0, pagina: 1, limite: 20 });
  });

  it("sin sesión responde 401", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/graduaciones") as never);
    expect(respuesta.status).toBe(401);
  });
});

describe("GET /api/graduaciones/[id]", () => {
  it("responde 404 si el acta está fuera del ámbito", async () => {
    mockObtenerSesion.mockResolvedValue(adminRegional);
    const { GET } = await import("../[id]/route");
    const respuesta = await GET(new Request("http://localhost/api/graduaciones/9") as never, {
      params: Promise.resolve({ id: "9" }),
    });
    expect(respuesta.status).toBe(404);
    expect(mockObtenerPorId).toHaveBeenCalledWith(expect.anything(), 9, {
      tipo: "region",
      regionId: 1,
    });
  });
});
