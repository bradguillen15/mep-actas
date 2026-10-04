import { describe, it, expect } from "vitest";
import { clasificarEnlace } from "../enlaces";

describe("clasificarEnlace", () => {
  it.each(["/ayuda", "/ayuda/auditoria", "#seccion"])("%s es interno", (href) => {
    expect(clasificarEnlace(href)).toBe("interno");
  });

  it.each(["https://www.mep.go.cr", "http://mep.go.cr/x", "HTTPS://mep.go.cr", "mailto:ayuda@mep.go.cr"])(
    "%s es externo",
    (href) => {
      expect(clasificarEnlace(href)).toBe("externo");
    }
  );

  it.each([
    "javascript:alert(1)",
    " JaVaScRiPt:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//evil.example.com",
    "vbscript:x",
    "ftp://servidor",
    "ruta/relativa",
    "",
  ])("%j es inseguro", (href) => {
    expect(clasificarEnlace(href)).toBe("inseguro");
  });
});
