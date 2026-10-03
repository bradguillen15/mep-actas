import { describe, it, expect } from "vitest";
import { ErrorNoEncontrado, ErrorProhibido } from "@/server/errores";
import { respuestaNoAutorizada, responderErrorDeRecurso } from "../respuestas";

describe("respuestaNoAutorizada", () => {
  it("devuelve el estado y el mensaje legible de la verificación rechazada", async () => {
    const respuesta = respuestaNoAutorizada({
      autorizado: false,
      estado: 403,
      mensaje: "No tiene permisos para realizar esta acción",
    });

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({
      error: "No tiene permisos para realizar esta acción",
    });
  });

  it("devuelve 401 con el mensaje de no autenticado", async () => {
    const respuesta = respuestaNoAutorizada({
      autorizado: false,
      estado: 401,
      mensaje: "No autorizado",
    });

    expect(respuesta.status).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autorizado" });
  });
});

describe("responderErrorDeRecurso", () => {
  it("mapea ErrorNoEncontrado a 404 con el mensaje indicado", async () => {
    const respuesta = responderErrorDeRecurso(new ErrorNoEncontrado("x"), "Acta no encontrada");

    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: "Acta no encontrada" });
  });

  it("mapea ErrorProhibido a 403 con el mensaje del error", async () => {
    const respuesta = responderErrorDeRecurso(new ErrorProhibido("Sin acceso"), "No encontrado");

    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: "Sin acceso" });
  });

  it("relanza los errores desconocidos", () => {
    expect(() => responderErrorDeRecurso(new Error("inesperado"), "No encontrado")).toThrow(
      "inesperado"
    );
  });
});
