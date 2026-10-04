import { describe, it, expect } from "vitest";
import {
  analizarJsonSeguro,
  compararDatos,
  etiquetaAccion,
  etiquetaTabla,
  varianteAccion,
} from "../auditoria";

describe("analizarJsonSeguro", () => {
  it("devuelve el objeto analizado", () => {
    expect(analizarJsonSeguro('{"a":1}')).toEqual({ a: 1 });
  });

  it("devuelve el texto crudo si no es JSON válido", () => {
    expect(analizarJsonSeguro("{roto")).toBe("{roto");
  });

  it("devuelve null para null", () => {
    expect(analizarJsonSeguro(null)).toBeNull();
  });
});

describe("etiquetas", () => {
  it("traduce acciones conocidas", () => {
    expect(etiquetaAccion("agregar_estudiante")).toBe("Agregó estudiante");
    expect(etiquetaAccion("crear")).toBe("Creó");
  });

  it("usa un respaldo legible para acciones desconocidas", () => {
    expect(etiquetaAccion("hacer_algo_raro")).toBe("Hacer algo raro");
  });

  it("traduce tablas conocidas y usa respaldo", () => {
    expect(etiquetaTabla("acta_estudiantes")).toBe("Estudiantes del acta");
    expect(etiquetaTabla("mesa_rara")).toBe("Mesa rara");
  });

  it("asigna variante por tipo de acción", () => {
    expect(varianteAccion("crear")).toBe("exito");
    expect(varianteAccion("desactivar")).toBe("error");
    expect(varianteAccion("actualizar")).toBe("neutro");
  });
});

describe("compararDatos", () => {
  it("marca filas cambiadas, agregadas y removidas", () => {
    const filas = compararDatos({ a: 1, b: 2, c: 3 }, { a: 1, b: 5, d: 4 });
    expect(filas).toEqual([
      { campo: "a", antes: "1", despues: "1", estado: "igual" },
      { campo: "b", antes: "2", despues: "5", estado: "cambiado" },
      { campo: "c", antes: "3", despues: undefined, estado: "removido" },
      { campo: "d", antes: undefined, despues: "4", estado: "agregado" },
    ]);
  });
});
