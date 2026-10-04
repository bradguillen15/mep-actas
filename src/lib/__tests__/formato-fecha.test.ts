import { describe, it, expect } from "vitest";
import { formatearFechaCorta, formatearFechaCompleta } from "../formato-fecha";

describe("formato-fecha", () => {
  const iso = "2026-03-05T14:30:00.000Z";

  it("formatea una fecha corta en es-CR", () => {
    expect(formatearFechaCorta(iso)).toMatch(/2026/);
  });

  it("incluye la hora en la fecha completa", () => {
    expect(formatearFechaCompleta(iso)).toMatch(/\d{1,2}:\d{2}/);
  });

  it("devuelve el texto original si la fecha es inválida", () => {
    expect(formatearFechaCorta("no-es-fecha")).toBe("no-es-fecha");
  });
});
