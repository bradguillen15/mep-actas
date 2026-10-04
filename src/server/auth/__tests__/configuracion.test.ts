import { describe, it, expect, vi, beforeEach } from "vitest";

const mockObtenerUsuarioPorEmail = vi.hoisted(() => vi.fn());
const mockObtenerAmbitoDeFuncionario = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ escuelaIds: [], regionIds: [] })
);
const mockRateLimiterLogin = vi.hoisted(() =>
  vi.fn().mockReturnValue({ permitido: true })
);

vi.mock("@/db/cliente", () => ({
  clienteDb: () => ({}),
}));

vi.mock("@/server/repositorios/usuarios.repositorio", () => ({
  obtenerUsuarioPorEmail: mockObtenerUsuarioPorEmail,
  obtenerAmbitoDeFuncionario: mockObtenerAmbitoDeFuncionario,
}));

vi.mock("../rate-limiter", () => ({
  rateLimiterLogin: mockRateLimiterLogin,
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn().mockResolvedValue(true),
}));

describe("authorize", () => {
  beforeEach(() => {
    mockObtenerUsuarioPorEmail.mockReset();
    mockObtenerAmbitoDeFuncionario.mockReset();
    mockObtenerAmbitoDeFuncionario.mockResolvedValue({
      escuelaIds: [],
      regionIds: [],
    });
    mockRateLimiterLogin.mockReturnValue({ permitido: true });
  });

  it("rechaza credenciales válidas de un usuario desactivado", async () => {
    mockObtenerUsuarioPorEmail.mockResolvedValue({
      id: 1,
      email: "staff@escuela.cr",
      passwordHash: "hash",
      funcionarioId: 1,
      rolId: 4,
      nivel: 4,
      activo: false,
    });

    const { config } = await import("../configuracion");
    const provider = config.providers[0] as unknown as {
      options: { authorize: (c: unknown, r: unknown) => Promise<unknown> };
    };

    const resultado = await provider.options.authorize(
      { email: "staff@escuela.cr", password: "cualquiera" },
      { headers: new Headers() }
    );

    expect(resultado).toBeNull();
  });

  it("permite credenciales válidas de un usuario activo", async () => {
    mockObtenerUsuarioPorEmail.mockResolvedValue({
      id: 1,
      email: "staff@escuela.cr",
      passwordHash: "hash",
      funcionarioId: 1,
      rolId: 4,
      nivel: 4,
      activo: true,
    });

    const { config } = await import("../configuracion");
    const provider = config.providers[0] as unknown as {
      options: { authorize: (c: unknown, r: unknown) => Promise<unknown> };
    };

    const resultado = await provider.options.authorize(
      { email: "staff@escuela.cr", password: "cualquiera" },
      { headers: new Headers() }
    );

    expect(resultado).not.toBeNull();
  });

  it("adjunta el ámbito (escuelaId/regionId) real del funcionario", async () => {
    mockObtenerUsuarioPorEmail.mockResolvedValue({
      id: 1,
      email: "escuela@escuela.cr",
      passwordHash: "hash",
      funcionarioId: 7,
      rolId: 3,
      nivel: 3,
      activo: true,
    });
    mockObtenerAmbitoDeFuncionario.mockResolvedValue({
      escuelaIds: [5],
      regionIds: [2],
    });

    const { config } = await import("../configuracion");
    const provider = config.providers[0] as unknown as {
      options: { authorize: (c: unknown, r: unknown) => Promise<unknown> };
    };

    const resultado = (await provider.options.authorize(
      { email: "escuela@escuela.cr", password: "cualquiera" },
      { headers: new Headers() }
    )) as { escuelaId?: number; regionId?: number };

    expect(mockObtenerAmbitoDeFuncionario).toHaveBeenCalledWith(
      expect.anything(),
      7
    );
    expect(resultado.escuelaId).toBe(5);
    expect(resultado.regionId).toBe(2);
  });
});

describe("callbacks jwt/session", () => {
  it("jwt propaga escuelaId/regionId del usuario al token", async () => {
    const { config } = await import("../configuracion");
    const token = await config.callbacks!.jwt!({
      token: {},
      user: {
        id: "1",
        rolId: 3,
        nivel: 3,
        funcionarioId: 7,
        escuelaId: 5,
        regionId: 2,
      },
    } as never);

    expect((token as Record<string, unknown>).escuelaId).toBe(5);
    expect((token as Record<string, unknown>).regionId).toBe(2);
  });

  it("session propaga escuelaId/regionId del token al usuario de sesión", async () => {
    const { config } = await import("../configuracion");
    const session = await config.callbacks!.session!({
      session: { user: {} },
      token: { escuelaId: 5, regionId: 2 },
    } as never);

    const usr = (session as unknown as { user: Record<string, unknown> })
      .user;
    expect(usr.escuelaId).toBe(5);
    expect(usr.regionId).toBe(2);
  });
});

describe("expiración de sesión", () => {
  it("define un maxAge explícito de 8 horas", async () => {
    const { config } = await import("../configuracion");
    expect(config.session?.maxAge).toBe(8 * 60 * 60);
  });
});
