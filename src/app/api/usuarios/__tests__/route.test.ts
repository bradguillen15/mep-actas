import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockCrearUsuario = vi.fn();

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
  crearUsuario: mockCrearUsuario,
  actualizarPassword: vi.fn(),
  cambiarEstadoUsuario: vi.fn(),
  obtenerNivelDeRol: vi.fn(),
  obtenerAmbitoDeFuncionario: vi.fn(),
}));

describe("POST /api/usuarios", () => {
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

  it("retorna 400 si la contraseña tiene menos de 12 caracteres", async () => {
    const { POST } = await import("../route");
    const req = new Request("http://localhost/api/usuarios", {
      method: "POST",
      body: JSON.stringify({
        funcionarioId: 5,
        rolId: 3,
        email: "nuevo@mep.go.cr",
        password: "corta1234",
      }),
    });

    const respuesta = await POST(req as never);

    expect(respuesta.status).toBe(400);
    expect(mockCrearUsuario).not.toHaveBeenCalled();
  });
});
