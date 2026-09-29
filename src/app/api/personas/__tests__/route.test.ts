import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarPersonas = vi.fn();
const mockPersonaMinima = vi.fn();
const mockPersonaPorIdentificacion = vi.fn();
const mockCrearPersona = vi.fn();
const mockAuditor = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({ obtenerSesion: mockObtenerSesion }));
vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));
vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));
vi.mock("@/server/servicios/auditoria.servicio", () => ({ crearAuditor: () => mockAuditor }));
vi.mock("@/server/repositorios/personas.repositorio", () => ({
  listarPersonas: mockListarPersonas,
  obtenerPersonaPorId: vi.fn(),
  obtenerPersonaPorIdentificacion: mockPersonaPorIdentificacion,
  obtenerPersonaMinimaPorIdentificacion: mockPersonaMinima,
  crearPersona: mockCrearPersona,
  actualizarPersona: vi.fn(),
}));

const staff = { usuarioId: 4, email: "s@mep.go.cr", nivel: 4, rolId: 4, funcionarioId: 4, escuelaId: 5 };
const personaMinima = { id: 7, identificacion: "101230002", nombres: "María", apellidos: "González Ruiz" };

beforeEach(() => {
  vi.clearAllMocks();
  mockListarPersonas.mockResolvedValue([]);
  mockPersonaMinima.mockResolvedValue(undefined);
  mockPersonaPorIdentificacion.mockResolvedValue(undefined);
  mockCrearPersona.mockResolvedValue(personaMinima);
});

async function consultar(consulta: string) {
  const { GET } = await import("../route");
  return GET(new Request(`http://localhost/api/personas${consulta}`) as never);
}

describe("GET /api/personas?identificacion=", () => {
  it("devuelve solo los campos mínimos de la persona, aunque esté fuera del ámbito", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    mockPersonaMinima.mockResolvedValue(personaMinima);
    const respuesta = await consultar("?identificacion=101230002");
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([personaMinima]);
    expect(mockListarPersonas).not.toHaveBeenCalled();
  });

  it("sin coincidencia exacta responde 200 con lista vacía", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    const respuesta = await consultar("?identificacion=10123");
    expect(await respuesta.json()).toEqual([]);
  });

  it("si llegan identificacion y busqueda, prevalece la identificación", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    await consultar("?identificacion=101230002&busqueda=Mora");
    expect(mockPersonaMinima).toHaveBeenCalledWith(expect.anything(), "101230002");
    expect(mockListarPersonas).not.toHaveBeenCalled();
  });

  it("sin sesión responde 401", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const respuesta = await consultar("?identificacion=101230002");
    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/personas", () => {
  async function crear(cuerpo: object) {
    const { POST } = await import("../route");
    return POST(
      new Request("http://localhost/api/personas", {
        method: "POST",
        body: JSON.stringify(cuerpo),
      }) as never
    );
  }

  const datos = { identificacion: "101230002", nombres: "María", apellidos: "González Ruiz" };

  it("Staff registra una persona y queda auditada", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    const respuesta = await crear(datos);
    expect(respuesta.status).toBe(201);
    expect(mockAuditor).toHaveBeenCalledWith(
      expect.objectContaining({ tabla: "personas", accion: "crear" })
    );
  });

  it("una identificación duplicada responde 400 sin auditar", async () => {
    mockObtenerSesion.mockResolvedValue(staff);
    mockPersonaPorIdentificacion.mockResolvedValue(personaMinima);
    const respuesta = await crear(datos);
    expect(respuesta.status).toBe(400);
    expect(mockCrearPersona).not.toHaveBeenCalled();
    expect(mockAuditor).not.toHaveBeenCalled();
  });

  it("sin sesión responde 401", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const respuesta = await crear(datos);
    expect(respuesta.status).toBe(401);
  });
});
