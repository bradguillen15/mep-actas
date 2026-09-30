import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockActualizarPassword = vi.fn();
const mockObtenerUsuarioPorId = vi.fn();
const mockCambiarEstado = vi.fn();

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

vi.mock("@/server/repositorios/usuarios.repositorio", () => ({
  listarUsuarios: vi.fn(),
  obtenerUsuarioPorId: mockObtenerUsuarioPorId,
  obtenerUsuarioPorEmail: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarPassword: mockActualizarPassword,
  cambiarEstadoUsuario: mockCambiarEstado,
  obtenerNivelDeRol: vi.fn(),
  obtenerAmbitoDeFuncionario: vi.fn(),
}));

describe("PATCH /api/usuarios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue({
      usuarioId: 1,
      email: "pais@mep.go.cr",
      nivel: 1,
      rolId: 1,
      funcionarioId: 1,
    });
  });

  it("retorna 400 si la nueva contraseña tiene menos de 12 caracteres", async () => {
    const { PATCH } = await import("../route");
    const req = new Request("http://localhost/api/usuarios/5", {
      method: "PATCH",
      body: JSON.stringify({ password: "corta1234" }),
    });

    const respuesta = await PATCH(req as never, {
      params: Promise.resolve({ id: "5" }),
    });

    expect(respuesta.status).toBe(400);
    expect(mockActualizarPassword).not.toHaveBeenCalled();
  });
});

describe("/api/usuarios/[id] con ámbito", () => {
  const adminRegional = { usuarioId: 2, email: "r@mep.go.cr", nivel: 2, rolId: 2, funcionarioId: 2, regionId: 1 };
  const params = { params: Promise.resolve({ id: "9" }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(adminRegional);
  });

  it("el Admin País consulta cualquier usuario", async () => {
    mockObtenerSesion.mockResolvedValue({ usuarioId: 1, email: "p@mep.go.cr", nivel: 1, rolId: 1, funcionarioId: 1 });
    mockObtenerUsuarioPorId.mockResolvedValue({ id: 9, funcionarioId: 9, rolId: 4, nivel: 4 });
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/usuarios/9") as never, params);
    expect(respuesta.status).toBe(200);
    expect(mockObtenerUsuarioPorId).toHaveBeenCalledWith(expect.anything(), 9, { tipo: "pais" });
  });

  it("GET fuera del ámbito responde 404", async () => {
    mockObtenerUsuarioPorId.mockResolvedValue(undefined);
    const { GET } = await import("../route");
    const respuesta = await GET(new Request("http://localhost/api/usuarios/9") as never, params);
    expect(respuesta.status).toBe(404);
    expect(mockObtenerUsuarioPorId).toHaveBeenCalledWith(expect.anything(), 9, {
      tipo: "region",
      regionId: 1,
    });
  });

  it("cambiar estado fuera del ámbito responde 404 con el mismo cuerpo que un usuario inexistente", async () => {
    mockObtenerUsuarioPorId.mockResolvedValue(undefined);
    const { PATCH } = await import("../route");
    const respuesta = await PATCH(
      new Request("http://localhost/api/usuarios/9", {
        method: "PATCH",
        body: JSON.stringify({ activo: false }),
      }) as never,
      params
    );
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Usuario no encontrado" });
    expect(mockCambiarEstado).not.toHaveBeenCalled();
  });

  it("un destino más privilegiado dentro del ámbito responde 403", async () => {
    mockObtenerUsuarioPorId.mockResolvedValue({ id: 9, funcionarioId: 9, rolId: 1, nivel: 1 });
    const { PATCH } = await import("../route");
    const respuesta = await PATCH(
      new Request("http://localhost/api/usuarios/9", {
        method: "PATCH",
        body: JSON.stringify({ activo: false }),
      }) as never,
      params
    );
    expect(respuesta.status).toBe(403);
    expect(mockCambiarEstado).not.toHaveBeenCalled();
  });
});
