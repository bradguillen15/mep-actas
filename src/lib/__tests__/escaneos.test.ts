import { describe, it, expect } from "vitest";
import { tipoContenidoDeExtension } from "../escaneos";

describe("tipoContenidoDeExtension", () => {
  it.each([
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["JPG", "image/jpeg"],
    ["png", "image/png"],
    ["pdf", "application/pdf"],
  ])("la extensión %s corresponde a %s", (extension, esperado) => {
    expect(tipoContenidoDeExtension(extension)).toBe(esperado);
  });

  it("rechaza extensiones no permitidas", () => {
    expect(() => tipoContenidoDeExtension("exe")).toThrow(/no permitida/i);
  });
});
