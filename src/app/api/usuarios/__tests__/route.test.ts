import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerSesion = vi.fn();
const mockListarUsuarios = vi.fn();
const mockObtenerUsuarioPorEmail = vi.fn();
const mockCrearUsuario = vi.fn();
const mockObtenerNivelDeRol = vi.fn();
const mockObtenerAmbitoDeFuncionario = vi.fn();

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
  listarUsuarios: mockListarUsuarios,
  obtenerUsuarioPorId: vi.fn(),
  obtenerUsuarioPorEmail: mockObtenerUsuarioPorEmail,
  crearUsuario: mockCrearUsuario,
  actualizarPassword: vi.fn(),
  cambiarEstadoUsuario: vi.fn(),
  obtenerNivelDeRol: mockObtenerNivelDeRol,
  obtenerAmbitoDeFuncionario: mockObtenerAmbitoDeFuncionario,
}));

const sesionAdminPais = {
  usuarioId: 1,
  email: "pais@mep.go.cr",
  nivel: 1,
  rolId: 1,
  funcionarioId: 1,
};

const sesionAdminEscuela = {
  usuarioId: 3,
  email: "escuela@mep.go.cr",
  nivel: 3,
  rolId: 3,
  funcionarioId: 3,
  escuelaId: 5,
};

const sesionStaff = {
  usuarioId: 4,
  email: "staff@mep.go.cr",
  nivel: 4,
  rolId: 4,
  funcionarioId: 4,
  escuelaId: 5,
};

function peticionCrear(cuerpo: Record<string, unknown>) {
  return new Request("http://localhost/api/usuarios", {
    method: "POST",
    body: JSON.stringify(cuerpo),
  });
}

describe("POST /api/usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObtenerSesion.mockResolvedValue(sesionAdminPais);
  });

  it("retorna 400 si la contraseña tiene menos de 12 caracteres", async () => {
    const { POST } = await import("../route");
    const respuesta = await POST(
      peticionCrear({
        funcionarioId: 5,
        rolId: 3,
        email: "nuevo@mep.go.cr",
        password: "corta1234",
      }) as never
    );

    expect(respuesta.status).toBe(400);
    expect(mockCrearUsuario).not.toHaveBeenCalled();
  });

  it("retorna 401 sin sesión: no hay auto-registro (BRD §6)", async () => {
    mockObtenerSesion.mockResolvedValue(null);
    const { POST } = await import("../route");

    const respuesta = await POST(
      peticionCrear({
        funcionarioId: 5,
        rolId: 4,
        email: "auto-registro@mep.go.cr",
        password: "ContrasenaLarga123",
      }) as never
    );

    expect(respuesta.status).toBe(401);
    expect(mockCrearUsuario).not.toHaveBeenCalled();
  });

  it("retorna 403 si un Staff intenta crear usuarios (BRD §6)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff);
    const { POST } = await import("../route");

    const respuesta = await POST(
      peticionCrear({
        funcionarioId: 5,
        rolId: 4,
        email: "creado-por-staff@mep.go.cr",
        password: "ContrasenaLarga123",
      }) as never
    );

    expect(respuesta.status).toBe(403);
    expect(mockCrearUsuario).not.toHaveBeenCalled();
  });

  it("retorna 201 cuando un Admin Escuela crea un Staff de su escuela (BRD §6)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminEscuela);
    mockObtenerNivelDeRol.mockResolvedValue(4);
    mockObtenerAmbitoDeFuncionario.mockResolvedValue({
      escuelaIds: [5],
      regionIds: [2],
    });
    mockObtenerUsuarioPorEmail.mockResolvedValue(undefined);
    mockCrearUsuario.mockResolvedValue({
      id: 10,
      funcionarioId: 9,
      rolId: 4,
      email: "staff-nuevo@mep.go.cr",
      activo: true,
    });
    const { POST } = await import("../route");

    const respuesta = await POST(
      peticionCrear({
        funcionarioId: 9,
        rolId: 4,
        email: "staff-nuevo@mep.go.cr",
        password: "ContrasenaLarga123",
      }) as never
    );

    expect(respuesta.status).toBe(201);
    expect(mockCrearUsuario).toHaveBeenCalledOnce();
  });
});

describe("GET /api/usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 200 para un Admin Escuela y lista solo su escuela (BRD §6)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminEscuela);
    mockListarUsuarios.mockResolvedValue([]);
    const { GET } = await import("../route");

    const respuesta = await GET();

    expect(respuesta.status).toBe(200);
    expect(mockListarUsuarios).toHaveBeenCalledWith(expect.anything(), {
      tipo: "escuela",
      escuelaId: 5,
    });
  });

  it("el Admin País lista todo el país", async () => {
    mockObtenerSesion.mockResolvedValue(sesionAdminPais);
    mockListarUsuarios.mockResolvedValue([]);
    const { GET } = await import("../route");

    await GET();

    expect(mockListarUsuarios).toHaveBeenCalledWith(expect.anything(), { tipo: "pais" });
  });

  it("retorna 403 para un Staff (BRD §6)", async () => {
    mockObtenerSesion.mockResolvedValue(sesionStaff);
    const { GET } = await import("../route");

    const respuesta = await GET();

    expect(respuesta.status).toBe(403);
    expect(mockListarUsuarios).not.toHaveBeenCalled();
  });
});
