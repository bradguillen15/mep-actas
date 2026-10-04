import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarResumenTomos = vi.fn();

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

vi.mock("@/server/almacenamiento/r2.util", () => ({
  construirClave: () => "escaneos/5/1/1.jpg",
  generarUrlSubida: async () => "https://r2.example/subida",
  generarUrlLectura: async () => "https://r2.example/lectura",
}));

vi.mock("@/server/repositorios/escaneos.repositorio", () => ({
  listarEscaneos: vi.fn(),
  listarResumenTomos: mockListarResumenTomos,
  obtenerEscaneoPorId: vi.fn(),
  obtenerEscaneoPorEscuelaTomoFolio: vi.fn(),
  crearEscaneo: vi.fn(),
  eliminarEscaneo: vi.fn(),
}));

describe("GET /api/escaneos/tomos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListarResumenTomos.mockResolvedValue([
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ]);
  });

  it("exige sesión", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const { GET } = await import("../route");
    const respuesta = await GET(
      new Request("http://localhost/api/escaneos/tomos?escuelaId=1") as never
    );
    expect(respuesta.status).toBe(401);
  });

  it("exige escuelaId porque los tomos son propios de cada escuela", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 1,
      email: "pais@mep.go.cr",
      nivel: 1,
      rolId: 1,
      funcionarioId: 1,
    });
    const { GET } = await import("../route");
    const respuesta = await GET(
      new Request("http://localhost/api/escaneos/tomos") as never
    );
    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toMatchObject({
      error: expect.stringMatching(/escuela/i),
    });
  });

  it("lista el resumen de tomos de la escuela indicada", async () => {
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 1,
      email: "pais@mep.go.cr",
      nivel: 1,
      rolId: 1,
      funcionarioId: 1,
    });
    const { GET } = await import("../route");
    const respuesta = await GET(
      new Request("http://localhost/api/escaneos/tomos?escuelaId=1") as never
    );
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual([
      { numeroTomo: 12, cantidadFolios: 18 },
      { numeroTomo: 14, cantidadFolios: 15 },
    ]);
    expect(mockListarResumenTomos).toHaveBeenCalledWith(
      expect.anything(),
      1,
      { tipo: "pais" }
    );
  });
});
