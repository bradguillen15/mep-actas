import { describe, it, expect, vi } from "vitest";
import { resolverPersonaPorIdentificacion } from "../personas";

const estudiante = {
  identificacion: "101230002",
  nombres: "María",
  apellidos: "González Ruiz",
};

function respuesta(cuerpo: unknown, ok = true) {
  return { ok, json: async () => cuerpo } as Response;
}

describe("resolverPersonaPorIdentificacion", () => {
  it("usa la persona cuya identificación coincide exactamente", async () => {
    const buscar = vi.fn().mockResolvedValue(
      respuesta([{ id: 7, identificacion: "101230002", nombres: "María", apellidos: "G" }])
    );
    expect(await resolverPersonaPorIdentificacion(estudiante, buscar)).toBe(7);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith("/api/personas?identificacion=101230002");
  });

  it("nunca toma el primer elemento si su identificación no coincide", async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(
        respuesta([{ id: 1, identificacion: "999999999", nombres: "Otra", apellidos: "P" }])
      )
      .mockResolvedValueOnce(respuesta({ id: 8 }));
    expect(await resolverPersonaPorIdentificacion(estudiante, buscar)).toBe(8);
    expect(buscar).toHaveBeenLastCalledWith(
      "/api/personas",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("crea la persona si la lista está vacía", async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(respuesta([]))
      .mockResolvedValueOnce(respuesta({ id: 9 }));
    expect(await resolverPersonaPorIdentificacion(estudiante, buscar)).toBe(9);
    const [, opciones] = buscar.mock.calls[1];
    expect(JSON.parse(opciones.body)).toEqual(estudiante);
  });

  it("falla si la búsqueda falla", async () => {
    const buscar = vi.fn().mockResolvedValue(respuesta(null, false));
    await expect(resolverPersonaPorIdentificacion(estudiante, buscar)).rejects.toThrow(
      "Error al buscar persona"
    );
  });

  it("falla si la creación falla", async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(respuesta([]))
      .mockResolvedValueOnce(respuesta({ error: "x" }, false));
    await expect(resolverPersonaPorIdentificacion(estudiante, buscar)).rejects.toThrow(
      "Error al crear persona"
    );
  });
});
