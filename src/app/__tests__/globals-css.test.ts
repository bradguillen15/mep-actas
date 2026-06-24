import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Tokens de diseño MEP", () => {
  const cssPath = path.resolve(__dirname, "../globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  const colores = [
    "--color-primario",
    "--color-primario-hover",
    "--color-acento",
    "--color-acento-suave",
    "--color-fondo",
    "--color-superficie",
    "--color-borde",
    "--color-texto",
    "--color-exito",
    "--color-error",
  ];

  for (const color of colores) {
    it(`define la variable CSS ${color}`, () => {
      expect(css).toContain(color);
    });
  }

  it("usa el valor hex correcto para primario (#0B3C8C)", () => {
    expect(css).toContain("#0B3C8C");
  });

  it("usa el valor hex correcto para acento (#D4A017)", () => {
    expect(css).toContain("#D4A017");
  });

  it("usa el valor hex correcto para error (#C0392B)", () => {
    expect(css).toContain("#C0392B");
  });

  it("usa el valor hex correcto para exito (#1E7E45)", () => {
    expect(css).toContain("#1E7E45");
  });
});
