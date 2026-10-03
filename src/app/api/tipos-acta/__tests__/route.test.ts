import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarTiposActa = vi.fn();
const mockCrearTipoActa = vi.fn();

vi.mock("@/db/cliente", () => ({ clienteDb: () => ({}) }));

vi.mock("@/server/servicios/tipos-acta.fabrica", () => ({
  crearServicioTiposActaDesdeDb: () => ({
    listarTiposActa: mockListarTiposActa,
    crearTipoActa: mockCrearTipoActa,
  }),
}));

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

describe("GET /api/tipos-acta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 si no hay sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);

    const { GET } = await import("../route");
    const respuesta = await GET();

    expect(respuesta.status).toBe(401);
  });

  it("lista tipos activos vía servicio", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
      escuelaId: 1,
    });
    mockListarTiposActa.mockResolvedValue([{ id: 1, nombre: "Graduación" }]);

    const { GET } = await import("../route");
    const respuesta = await GET();

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([{ id: 1, nombre: "Graduación" }]);
  });
});

describe("POST /api/tipos-acta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 en español si el rol no alcanza", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 4,
      email: "staff@escuela.go.cr",
      nivel: 4,
      rolId: 4,
      funcionarioId: 4,
      escuelaId: 1,
    });

    const { POST } = await import("../route");
    const respuesta = await POST(
      new Request("http://localhost/api/tipos-acta", {
        method: "POST",
        body: JSON.stringify({ nombre: "Nuevo" }),
      })
    );

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para realizar esta acción",
    });
  });

  it("crea un tipo vía servicio", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 3,
      email: "admin@escuela.go.cr",
      nivel: 3,
      rolId: 3,
      funcionarioId: 3,
      escuelaId: 1,
    });
    mockCrearTipoActa.mockResolvedValue({
      id: 2,
      nombre: "Promoción",
      activo: true,
    });

    const { POST } = await import("../route");
    const respuesta = await POST(
      new Request("http://localhost/api/tipos-acta", {
        method: "POST",
        body: JSON.stringify({ nombre: "Promoción" }),
      })
    );

    expect(respuesta.status).toBe(201);
    expect(mockCrearTipoActa).toHaveBeenCalledWith(
      { nombre: "Promoción" },
      expect.objectContaining({ usuarioId: 3 })
    );
  });
});
