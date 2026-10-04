import { describe, it, expect } from "vitest";
import { validarPassword } from "../politica-password";

describe("validarPassword", () => {
  it("rechaza contraseñas de menos de 12 caracteres", () => {
    expect(validarPassword("corta1234")).toMatch(/al menos 12 caracteres/);
  });

  it("acepta contraseñas de 12 caracteres o más", () => {
    expect(validarPassword("contraseñaSegura123")).toBeNull();
  });
});
