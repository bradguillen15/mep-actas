import { describe, it, expect, vi, beforeEach } from "vitest";

const signOutMock = vi.fn().mockResolvedValue(undefined);

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

describe("cerrarSesion", () => {
  beforeEach(() => {
    signOutMock.mockClear();
  });

  it("invoca signOut de NextAuth con redirección a iniciar sesión", async () => {
    const { cerrarSesion } = await import("../cerrar-sesion");

    await cerrarSesion();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(signOutMock).toHaveBeenCalledWith({
      callbackUrl: "/iniciar-sesion",
    });
  });
});
