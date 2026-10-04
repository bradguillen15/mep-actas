import { describe, it, expect } from "vitest";
import { temasAyuda } from "../temas";
import { slugsConContenido } from "../slugs";

describe("catálogo de temas de ayuda", () => {
  it("no repite slugs", () => {
    const slugs = temasAyuda.map((tema) => tema.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada tema declara niveles válidos y no vacíos", () => {
    for (const tema of temasAyuda) {
      expect(tema.niveles.length).toBeGreaterThan(0);
      for (const nivel of tema.niveles) {
        expect([1, 2, 3, 4]).toContain(nivel);
      }
    }
  });

  it("cada tema tiene título y descripción", () => {
    for (const tema of temasAyuda) {
      expect(tema.titulo.trim()).not.toBe("");
      expect(tema.descripcion.trim()).not.toBe("");
    }
  });

  it("cada tema del catálogo tiene su contenido registrado", () => {
    for (const tema of temasAyuda) {
      expect(slugsConContenido).toContain(tema.slug);
    }
  });

  it("no hay contenido registrado sin tema en el catálogo", () => {
    const slugsCatalogo = temasAyuda.map((tema) => tema.slug);
    for (const slug of slugsConContenido) {
      expect(slugsCatalogo).toContain(slug);
    }
  });

  it("el tema de auditoría es visible para los niveles 1 a 4", () => {
    const tema = temasAyuda.find((candidato) => candidato.slug === "auditoria");
    expect(tema?.niveles).toEqual([1, 2, 3, 4]);
  });
});
