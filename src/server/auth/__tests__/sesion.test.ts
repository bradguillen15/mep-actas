import { describe, it, expect, vi } from "vitest";

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  default: () => ({ auth: mockAuth }),
}));

vi.mock("../auth.config", () => ({
  auth: mockAuth,
  handlers: {},
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

  it("incluye escuelaId y regionId cuando vienen en la sesion", async () => {
    mockAuth.mockResolvedValue({
      user: {
        usuarioId: 3,
        email: "escuela@test.com",
        nivel: 3,
        rolId: 3,
        funcionarioId: 7,
        escuelaId: 5,
        regionId: 2,
      },
    });

    const { obtenerSesion } = await import("../sesion.servicio");
    const sesion = await obtenerSesion();
    expect(sesion?.escuelaId).toBe(5);
    expect(sesion?.regionId).toBe(2);
  });

  it("deja escuelaId y regionId indefinidos para Admin País", async () => {
    mockAuth.mockResolvedValue({
      user: {
        usuarioId: 1,
        email: "pais@test.com",
        nivel: 1,
        rolId: 1,
        funcionarioId: 1,
      },
    });

    const { obtenerSesion } = await import("../sesion.servicio");
    const sesion = await obtenerSesion();
    expect(sesion?.escuelaId).toBeUndefined();
    expect(sesion?.regionId).toBeUndefined();
  });
});
