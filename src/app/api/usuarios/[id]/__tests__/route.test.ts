import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockActualizarPassword = vi.fn();

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
  obtenerUsuarioPorId: vi.fn(),
  obtenerUsuarioPorEmail: vi.fn(),
  crearUsuario: vi.fn(),
  actualizarPassword: mockActualizarPassword,
  cambiarEstadoUsuario: vi.fn(),
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
