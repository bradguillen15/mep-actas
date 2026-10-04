import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  enviarJson,
  patchJson,
  eliminarJson,
  obtenerJsonEstricto,
} from "../api-cliente";

function respuesta(estado: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status: estado });
}

describe("api-cliente", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("obtenerJsonEstricto", () => {
    it("falla si la respuesta no es ok", async () => {
      fetchMock.mockResolvedValue(respuesta(500, { error: "fallo" }));

      await expect(obtenerJsonEstricto("/api/x")).rejects.toThrow(
        "Error 500 al consultar /api/x"
      );
    });
  });

  describe("enviarJson", () => {
    it("hace POST y no lanza si ok", async () => {
      fetchMock.mockResolvedValue(respuesta(201, { id: 1 }));

      await expect(
        enviarJson("/api/x", { nombre: "a" }, "falló")
      ).resolves.toBeUndefined();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/x",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("propaga el mensaje de error de la API", async () => {
      fetchMock.mockResolvedValue(respuesta(400, { error: "Nombre requerido" }));

      await expect(
        enviarJson("/api/x", {}, "falló")
      ).rejects.toThrow("Nombre requerido");
    });
  });

  describe("patchJson", () => {
    it("hace PATCH con el mismo contrato que enviarJson", async () => {
      fetchMock.mockResolvedValue(respuesta(200, { ok: true }));

      await patchJson("/api/x/1", { activo: false }, "No se pudo actualizar");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/x/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ activo: false }),
        })
      );
    });

    it("propaga el mensaje de error de la API", async () => {
      fetchMock.mockResolvedValue(respuesta(403, { error: "Sin permisos" }));

      await expect(
        patchJson("/api/x/1", {}, "falló")
      ).rejects.toThrow("Sin permisos");
    });
  });

  describe("eliminarJson", () => {
    it("hace DELETE y propaga errores de la API", async () => {
      fetchMock.mockResolvedValue(
        respuesta(409, { error: "Tiene actas asociadas" })
      );

      await expect(
        eliminarJson("/api/x/1", "No se pudo eliminar")
      ).rejects.toThrow("Tiene actas asociadas");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/x/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
