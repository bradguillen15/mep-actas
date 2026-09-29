import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarFuncionarios = vi.fn();
const mockObtenerFuncionarioPorId = vi.fn();
const mockActualizarFuncionario = vi.fn();
const mockAuditor = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({ obtenerSesion: mockObtenerSesion }));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/servicios/auditoria.servicio", () => ({ crearAuditor: () => mockAuditor }));
vi.mock("@/server/repositorios/funcionarios.repositorio", () => ({
  listarFuncionarios: mockListarFuncionarios,
  obtenerFuncionarioPorId: mockObtenerFuncionarioPorId,
  crearFuncionario: vi.fn(),
  actualizarFuncionario: mockActualizarFuncionario,
  asignarFuncionarioAEscuela: vi.fn(),
  removerFuncionarioDeEscuela: vi.fn(),
  listarEscuelasDeFuncionario: vi.fn(),
}));

const adminEscuela = { usuarioId: 3, email: "e@mep.go.cr", nivel: 3, rolId: 3, funcionarioId: 3, escuelaId: 5 };
const adminRegional = { usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 1 };
const params = { params: Promise.resolve({ id: "4" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mockListarFuncionarios.mockResolvedValue([]);
});

describe("GET /api/funcionarios", () => {
  it("Admin Escuela lista solo funcionarios de su escuela", async () => {
    mockObtenerSesion.mockResolvedValue(adminEscuela);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/funcionarios") as never);
    expect(respuesta.status).toBe(200);
    expect(mockListarFuncionarios).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      { tipo: "escuela", escuelaId: 5 }
    );
  });
});

describe("/api/funcionarios/[id]", () => {
  it("GET de un funcionario de otra región responde 404", async () => {
    mockObtenerSesion.mockResolvedValue(adminRegional);
    mockObtenerFuncionarioPorId.mockResolvedValue(undefined);
    const { GET } = await import("../[id]/route");
    const respuesta = await GET(new Request("http://localhost/api/funcionarios/4") as never, params);
    expect(respuesta.status).toBe(404);
    expect(mockObtenerFuncionarioPorId).toHaveBeenCalledWith(expect.anything(), 4, {
      tipo: "region",
      regionId: 1,
    });
  });

  it("PATCH fuera del ámbito responde 404 sin cambios ni auditoría", async () => {
    mockObtenerSesion.mockResolvedValue(adminRegional);
    mockObtenerFuncionarioPorId.mockResolvedValue(undefined);
    const { PATCH } = await import("../[id]/route");
    const respuesta = await PATCH(
      new Request("http://localhost/api/funcionarios/4", {
        method: "PATCH",
        body: JSON.stringify({ puesto: "Director" }),
      }) as never,
      params
    );
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Funcionario no encontrado" });
    expect(mockActualizarFuncionario).not.toHaveBeenCalled();
    expect(mockAuditor).not.toHaveBeenCalled();
  });
});
