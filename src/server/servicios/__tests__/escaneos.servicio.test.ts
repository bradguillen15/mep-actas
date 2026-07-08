import { describe, it, expect, vi } from "vitest";

const mockGenerarUrlLectura = vi.hoisted(() => vi.fn());

vi.mock("@/server/almacenamiento/r2.util", () => ({
  construirClave: vi.fn(),
  generarUrlSubida: vi.fn(),
  generarUrlLectura: mockGenerarUrlLectura,
}));

import { crearServicioEscaneos } from "../escaneos.servicio";

describe("listarConUrlLectura", () => {
  it("adjunta la URL firmada de lectura a cada escaneo listado", async () => {
    mockGenerarUrlLectura.mockImplementation(
      async (clave: string) => `https://r2.example/${clave}?firmado=1`
    );

    const repositorio = {
      listarEscaneos: vi.fn().mockResolvedValue([
        {
          id: 1,
          escuelaId: 1,
          numeroTomo: 1,
          numeroFolio: 1,
          url: "escaneos/1/1/1.jpg",
          formato: "jpg",
          uploadedBy: 1,
          createdAt: "2026-01-01",
        },
      ]),
      obtenerEscaneoPorId: vi.fn(),
      crearEscaneo: vi.fn(),
      eliminarEscaneo: vi.fn(),
    };

    const servicio = crearServicioEscaneos(repositorio, vi.fn());
    const resultado = await servicio.listarConUrlLectura({});

    expect(resultado[0].urlLectura).toBe(
      "https://r2.example/escaneos/1/1/1.jpg?firmado=1"
    );
    expect(resultado[0].url).toBe("escaneos/1/1/1.jpg");
  });
});
