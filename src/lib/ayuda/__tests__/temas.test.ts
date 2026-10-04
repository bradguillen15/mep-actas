import { describe, it, expect } from "vitest";
import { buscarTemas, temasVisiblesPara, type TemaAyuda } from "../temas";

function crearTema(parcial: Partial<TemaAyuda> & { slug: string }): TemaAyuda {
  return {
    titulo: parcial.slug,
    descripcion: "",
    niveles: [1, 2, 3, 4],
    orden: 1,
    palabrasClave: [],
    ...parcial,
  };
}

const catalogo: TemaAyuda[] = [
  crearTema({ slug: "usuarios", titulo: "Gestionar usuarios", orden: 3, niveles: [1, 2, 3] }),
  crearTema({ slug: "configuracion", titulo: "Configuración del sistema", orden: 4, niveles: [1] }),
  crearTema({
    slug: "iniciar-sesion",
    titulo: "Iniciar sesión",
    descripcion: "Cómo ingresar al sistema",
    orden: 1,
    palabrasClave: ["contraseña", "acceso"],
  }),
  crearTema({ slug: "actas", titulo: "Registrar actas", orden: 2, niveles: [1, 2, 3, 4] }),
];

describe("temasVisiblesPara", () => {
  it("el nivel 1 ve todos los temas ordenados por orden", () => {
    expect(temasVisiblesPara(catalogo, 1).map((t) => t.slug)).toEqual([
      "iniciar-sesion",
      "actas",
      "usuarios",
      "configuracion",
    ]);
  });

  it("el nivel 2 no ve los temas exclusivos del nivel 1", () => {
    expect(temasVisiblesPara(catalogo, 2).map((t) => t.slug)).toEqual([
      "iniciar-sesion",
      "actas",
      "usuarios",
    ]);
  });

  it("el nivel 3 ve los temas que lo incluyen", () => {
    expect(temasVisiblesPara(catalogo, 3).map((t) => t.slug)).toContain("usuarios");
  });

  it("el nivel 4 solo ve los temas generales", () => {
    expect(temasVisiblesPara(catalogo, 4).map((t) => t.slug)).toEqual([
      "iniciar-sesion",
      "actas",
    ]);
  });

  it("no modifica el arreglo original", () => {
    const copia = [...catalogo];
    temasVisiblesPara(catalogo, 1);
    expect(catalogo).toEqual(copia);
  });
});

describe("buscarTemas", () => {
  it("devuelve todos los temas con una consulta vacía o en blanco", () => {
    expect(buscarTemas(catalogo, "")).toEqual(catalogo);
    expect(buscarTemas(catalogo, "   ")).toEqual(catalogo);
  });

  it("busca por título sin distinguir mayúsculas", () => {
    expect(buscarTemas(catalogo, "REGISTRAR").map((t) => t.slug)).toEqual(["actas"]);
  });

  it("busca sin distinguir tildes en ambos sentidos", () => {
    expect(buscarTemas(catalogo, "configuracion").map((t) => t.slug)).toEqual(["configuracion"]);
    expect(buscarTemas(catalogo, "sesión").map((t) => t.slug)).toEqual(["iniciar-sesion"]);
    expect(buscarTemas(catalogo, "sesion").map((t) => t.slug)).toEqual(["iniciar-sesion"]);
  });

  it("busca por descripción", () => {
    expect(buscarTemas(catalogo, "ingresar").map((t) => t.slug)).toEqual(["iniciar-sesion"]);
  });

  it("busca por palabras clave", () => {
    expect(buscarTemas(catalogo, "contrasena").map((t) => t.slug)).toEqual(["iniciar-sesion"]);
  });

  it("devuelve una lista vacía si nada coincide", () => {
    expect(buscarTemas(catalogo, "xyz")).toEqual([]);
  });

  it("ignora espacios al inicio y al final de la consulta", () => {
    expect(buscarTemas(catalogo, "  actas  ").map((t) => t.slug)).toEqual(["actas"]);
  });
});
