import { describe, it, expect } from "vitest";
import {
  EXTENSIONES_PERMITIDAS,
  extensionDeArchivo,
  extensionPermitida,
  tipoContenidoDeArchivo,
  tipoContenidoDeExtension,
} from "../escaneos";

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

describe("extensionDeArchivo", () => {
  it.each([
    ["folio.PNG", "png"],
    ["a.b.pdf", "pdf"],
    ["sin-extension", ""],
    ["termina-en-punto.", ""],
  ])("de %s obtiene %s", (nombre, esperado) => {
    expect(extensionDeArchivo(nombre)).toBe(esperado);
  });
});

describe("extensionPermitida y tipoContenidoDeArchivo", () => {
  it("acepta por extensión sin depender del tipo del navegador", () => {
    expect(extensionPermitida("folio.PNG")).toBe(true);
    expect(tipoContenidoDeArchivo("folio.PNG")).toBe("image/png");
  });

  it.each(["foto.gif", "nota.txt", "sin-extension"])("rechaza %s", (nombre) => {
    expect(extensionPermitida(nombre)).toBe(false);
    expect(tipoContenidoDeArchivo(nombre)).toBeNull();
  });

  it("expone las extensiones permitidas", () => {
    expect(EXTENSIONES_PERMITIDAS).toEqual(["jpg", "jpeg", "png", "pdf"]);
  });
});
