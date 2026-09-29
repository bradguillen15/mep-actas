import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockResolverAmbitoDeEscuela = vi.fn();
const mockCrearActa = vi.fn();

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

vi.mock("@/server/repositorios/escuelas.repositorio", () => ({
  resolverAmbitoDeEscuela: mockResolverAmbitoDeEscuela,
}));

vi.mock("@/server/servicios/auditoria.servicio", () => ({
  crearAuditor: () => vi.fn(),
}));

vi.mock("@/server/repositorios/actas.repositorio", () => ({
  listarActas: vi.fn(),
  obtenerActaPorId: vi.fn(),
  crearActa: mockCrearActa,
  actualizarActa: vi.fn(),
}));

vi.mock("@/server/repositorios/actas.detalle.repositorio", () => ({
  listarEstudiantesDeActa: vi.fn(),
  agregarEstudianteAActa: vi.fn(),
  listarFirmantesDeActa: vi.fn(),
  agregarFirmante: vi.fn(),
}));

function sesionStaff() {
  return {
    usuarioId: 4,
    email: "staff@escuela.go.cr",
    nivel: 4,
    rolId: 4,
    funcionarioId: 4,
    escuelaId: 5,
  };
}

function sesionAdminEscuela() {
  return {
    usuarioId: 3,
    email: "escuela@mep.go.cr",
    nivel: 3,
    rolId: 3,
    funcionarioId: 3,
    escuelaId: 5,
  };
}

function sesionAdminRegional() {
  return {
    usuarioId: 2,
    email: "regional@mep.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 1,
  };
}

function sesionAdminPais() {
  return {
    usuarioId: 1,
    email: "pais@mep.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };
}

describe("POST /api/actas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCrearActa.mockResolvedValue({ id: 1, escuelaId: 5, titulo: "Acta" });
  });

  it("permite a Staff (nivel 4) crear un acta en su propia escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 5, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
    expect(mockCrearActa).toHaveBeenCalled();
  });

  it("deniega a Staff crear un acta en otra escuela", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 10, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(mockCrearActa).not.toHaveBeenCalled();
  });

  it("Admin Escuela (nivel 3) sigue pudiendo crear actas en su propia escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminEscuela());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 5, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });

  it("Admin Regional (nivel 2) registra en una escuela de su región", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue({ escuelaId: 7, regionId: 1 });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 7, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 7);
    expect(mockCrearActa).toHaveBeenCalled();
  });

  it("Admin Regional (nivel 2) no registra en una escuela de otra región", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue({ escuelaId: 8, regionId: 2 });

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 8, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 8);
    expect(mockCrearActa).not.toHaveBeenCalled();
  });

  it("Admin Regional (nivel 2) recibe 403 si la escuela no existe", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminRegional());
    mockResolverAmbitoDeEscuela.mockResolvedValue(undefined);

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 999, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(403);
    expect(mockResolverAmbitoDeEscuela).toHaveBeenCalledWith(expect.anything(), 999);
    expect(mockCrearActa).not.toHaveBeenCalled();
  });

  it("Admin País (nivel 1) sigue sin restricción de escuela (regresión)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminPais());

    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/actas", {
      method: "POST",
      body: JSON.stringify({ escuelaId: 999, titulo: "Acta" }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(201);
  });
});
