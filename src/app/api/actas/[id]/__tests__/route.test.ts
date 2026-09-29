import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockObtenerActaPorId = vi.fn();
const mockActualizarActa = vi.fn();
const mockListarEstudiantes = vi.fn();
const mockAgregarEstudiante = vi.fn();
const mockListarFirmantes = vi.fn();
const mockAgregarFirmante = vi.fn();
const mockAuditor = vi.fn();

vi.mock("@/server/auth/sesion.servicio", () => ({
  obtenerSesion: mockObtenerSesion,
}));

vi.mock("next-auth", () => ({
  default: () => ({ auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => mockAuditor,
}));

vi.mock("@/server/repositorios/actas.repositorio", () => ({
  listarActas: vi.fn(),
  obtenerActaPorId: mockObtenerActaPorId,
  crearActa: vi.fn(),
  actualizarActa: mockActualizarActa,
}));

vi.mock("@/server/repositorios/actas.detalle.repositorio", () => ({
  listarEstudiantesDeActa: mockListarEstudiantes,
  agregarEstudianteAActa: mockAgregarEstudiante,
  listarFirmantesDeActa: mockListarFirmantes,
  agregarFirmante: mockAgregarFirmante,
}));

const actaEscuela5 = { id: 1, escuelaId: 5, titulo: "Acta" };

const sesiones = {
  staff: { usuarioId: 4, email: "s@mep.go.cr", nivel: 4, rolId: 4, funcionarioId: 4, escuelaId: 5 },
  adminEscuela: { usuarioId: 3, email: "e@mep.go.cr", nivel: 3, rolId: 3, funcionarioId: 3, escuelaId: 5 },
  adminRegional: { usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 1 },
  adminPais: { usuarioId: 1, email: "p@mep.go.cr", nivel: 1, rolId: 1, funcionarioId: 1 },
};

const params = { params: Promise.resolve({ id: "1" }) };

function peticion(metodo: string, cuerpo?: object) {
  return new Request("http://localhost/api/actas/1", {
    method: metodo,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockObtenerActaPorId.mockResolvedValue(actaEscuela5);
  mockListarEstudiantes.mockResolvedValue([]);
  mockListarFirmantes.mockResolvedValue([]);
  mockAgregarEstudiante.mockResolvedValue({ id: 9 });
  mockAgregarFirmante.mockResolvedValue({ id: 8 });
  mockActualizarActa.mockResolvedValue(actaEscuela5);
});

describe("GET /api/actas/[id]", () => {
  it("consulta el acta con el ámbito de la sesión", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.adminRegional);
    const { GET } = await import("../route");
    const respuesta = await GET(peticion("GET"), params);
    expect(respuesta.status).toBe(200);
    expect(mockObtenerActaPorId).toHaveBeenCalledWith(expect.anything(), 1, {
      tipo: "region",
      regionId: 1,
    });
  });

  it("responde 404 con el mismo cuerpo si el acta es ajena o no existe", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.adminEscuela);
    mockObtenerActaPorId.mockResolvedValue(undefined);
    const { GET } = await import("../route");
    const respuesta = await GET(peticion("GET"), params);
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Acta no encontrada" });
  });
});

describe("PATCH /api/actas/[id]", () => {
  it("responde 404 sin escribir ni auditar si el acta es ajena", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.adminEscuela);
    mockObtenerActaPorId.mockResolvedValue(undefined);
    const { PATCH } = await import("../route");
    const respuesta = await PATCH(peticion("PATCH", { titulo: "X" }), params);
    expect(respuesta.status).toBe(404);
    expect(mockActualizarActa).not.toHaveBeenCalled();
    expect(mockAuditor).not.toHaveBeenCalled();
  });

  it("un nivel insuficiente sigue en 403 antes del ámbito", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.staff);
    const { PATCH } = await import("../route");
    const respuesta = await PATCH(peticion("PATCH", { titulo: "X" }), params);
    expect(respuesta.status).toBe(403);
    expect(mockObtenerActaPorId).not.toHaveBeenCalled();
  });
});

describe.each([
  {
    nombre: "estudiantes",
    ruta: "../estudiantes/route",
    cuerpo: { personaId: 3, numeroCertificado: 7 },
    listar: mockListarEstudiantes,
    agregar: mockAgregarEstudiante,
  },
  {
    nombre: "firmantes",
    ruta: "../firmantes/route",
    cuerpo: { funcionarioId: 2, rolFirma: "Director" },
    listar: mockListarFirmantes,
    agregar: mockAgregarFirmante,
  },
])("/api/actas/[id]/$nombre", ({ ruta, cuerpo, listar, agregar }) => {
  it("GET de un acta ajena responde 404 sin listar", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.adminEscuela);
    mockObtenerActaPorId.mockResolvedValue(undefined);
    const { GET } = await import(ruta);
    const respuesta = await GET(peticion("GET"), params);
    expect(respuesta.status).toBe(404);
    expect(listar).not.toHaveBeenCalled();
  });

  it("GET de un acta del ámbito responde 200", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.staff);
    const { GET } = await import(ruta);
    const respuesta = await GET(peticion("GET"), params);
    expect(respuesta.status).toBe(200);
  });

  it("Staff agrega en un acta de su escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.staff);
    const { POST } = await import(ruta);
    const respuesta = await POST(peticion("POST", cuerpo), params);
    expect(respuesta.status).toBe(201);
    expect(agregar).toHaveBeenCalled();
  });

  it("POST sobre un acta ajena responde 404 sin escribir ni auditar", async () => {
    mockObtenerSesion.mockResolvedValue(sesiones.staff);
    mockObtenerActaPorId.mockResolvedValue(undefined);
    const { POST } = await import(ruta);
    const respuesta = await POST(peticion("POST", cuerpo), params);
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Acta no encontrada" });
    expect(agregar).not.toHaveBeenCalled();
    expect(mockAuditor).not.toHaveBeenCalled();
  });

  it("POST sin sesión responde 401", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const { POST } = await import(ruta);
    const respuesta = await POST(peticion("POST", cuerpo), params);
    expect(respuesta.status).toBe(401);
  });
});
