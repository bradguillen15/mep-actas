import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockObtenerPersonaPorId = vi.fn();
const mockActualizarPersona = vi.fn();
const mockAuditor = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({ obtenerSesion: mockObtenerSesion }));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/servicios/auditoria.servicio", () => ({ crearAuditor: () => mockAuditor }));
vi.mock("@/server/repositorios/personas.repositorio", () => ({
  listarPersonas: vi.fn(),
  obtenerPersonaPorId: mockObtenerPersonaPorId,
  obtenerPersonaPorIdentificacion: vi.fn(),
  obtenerPersonaMinimaPorIdentificacion: vi.fn(),
  crearPersona: vi.fn(),
  actualizarPersona: mockActualizarPersona,
}));

const staff = { usuarioId: 4, email: "s@mep.go.cr", nivel: 4, rolId: 4, funcionarioId: 4, escuelaId: 5 };
const adminRegional = { usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 1 };
const adminPais = { usuarioId: 1, email: "p@mep.go.cr", nivel: 1, rolId: 1, funcionarioId: 1 };
const persona = { id: 3, identificacion: "1", nombres: "Ana", apellidos: "Mora" };
const params = { params: Promise.resolve({ id: "3" }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/personas/[id]", () => {
  it("Staff no ve a una persona sin vínculo con su escuela", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    mockObtenerPersonaPorId.mockResolvedValue(undefined);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/personas/3") as never, params);
    expect(respuesta.status).toBe(404);
    expect(mockObtenerPersonaPorId).toHaveBeenCalledWith(expect.anything(), 3, {
      tipo: "escuela",
      escuelaId: 5,
    });
  });

  it("el Admin País consulta sin restricción", async () => {
    mockObtenerSesion.mockResolvedValue(adminPais);
    mockObtenerPersonaPorId.mockResolvedValue(persona);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/personas/3") as never, params);
    expect(respuesta.status).toBe(200);
    expect(mockObtenerPersonaPorId).toHaveBeenCalledWith(expect.anything(), 3, { tipo: "pais" });
  });
});

describe("PATCH /api/personas/[id]", () => {
  it("fuera del ámbito responde 404 sin cambios ni auditoría", async () => {
    mockObtenerSesion.mockResolvedValue(adminRegional);
    mockObtenerPersonaPorId.mockResolvedValue(undefined);
    const { PATCH } = await import("../route");
    const respuesta = await PATCH(
      new Request("http://localhost/api/personas/3", {
        method: "PATCH",
        body: JSON.stringify({ nombres: "Otra" }),
      }) as never,
      params
    );
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Persona no encontrada" });
    expect(mockActualizarPersona).not.toHaveBeenCalled();
    expect(mockAuditor).not.toHaveBeenCalled();
  });
});
