import { describe, it, expect, vi } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  default: () => ({ auth: mockAuth }),
}));

vi.mock("../auth.config", () => ({
  config: {},
}));

describe("obtenerSesion", () => {
  it("retorna la sesion cuando existe", async () => {
    mockAuth.mockResolvedValue({
      user: {
        usuarioId: 1,
        email: "test@test.com",
        nivel: 1,
        rolId: 1,
        funcionarioId: 1,
      },
    });

    const { obtenerSesion } = await import("../sesion.servicio");
    const sesion = await obtenerSesion();
    expect(sesion).toBeDefined();
    expect(sesion?.usuarioId).toBe(1);
  });

  it("retorna null cuando no hay sesion", async () => {
    mockAuth.mockResolvedValue(null);

    const { obtenerSesion } = await import("../sesion.servicio");
    const sesion = await obtenerSesion();
    expect(sesion).toBeNull();
  });
});
