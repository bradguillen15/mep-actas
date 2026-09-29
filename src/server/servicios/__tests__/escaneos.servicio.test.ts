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
    const resultado = await servicio.listarConUrlLectura({}, { tipo: "pais" });

    expect(resultado[0].urlLectura).toBe(
      "https://r2.example/escaneos/1/1/1.jpg?firmado=1"
    );
    expect(resultado[0].url).toBe("escaneos/1/1/1.jpg");
  });
});

describe("escaneos con ámbito", () => {
  function crearDobles() {
    const repositorio = {
      listarEscaneos: vi.fn().mockResolvedValue([]),
      obtenerEscaneoPorId: vi.fn().mockResolvedValue(undefined),
      crearEscaneo: vi.fn(),
      eliminarEscaneo: vi.fn(),
    };
    const auditor = vi.fn();
    return { repositorio, auditor, servicio: crearServicioEscaneos(repositorio, auditor) };
  }

  const staff = {
    usuarioId: 4, email: "s@mep.go.cr", rolId: 4, nivel: 4 as const, funcionarioId: 4, escuelaId: 5,
  };

  it("propaga el ámbito al listar", async () => {
    const { repositorio, servicio } = crearDobles();
    await servicio.listarConUrlLectura({ tomo: 2 }, { tipo: "escuela", escuelaId: 5 });
    expect(repositorio.listarEscaneos).toHaveBeenCalledWith(
      { tomo: 2 },
      { tipo: "escuela", escuelaId: 5 }
    );
  });

  it("no firma URL de un escaneo fuera del ámbito", async () => {
    mockGenerarUrlLectura.mockClear();
    const { servicio } = crearDobles();
    const url = await servicio.generarUrlLectura(1, { tipo: "escuela", escuelaId: 5 });
    expect(url).toBeUndefined();
    expect(mockGenerarUrlLectura).not.toHaveBeenCalled();
  });

  it("eliminar fuera del ámbito lanza NotFoundError sin borrar ni auditar", async () => {
    const { repositorio, auditor, servicio } = crearDobles();
    await expect(servicio.eliminarEscaneo(1, staff)).rejects.toMatchObject({
      name: "NotFoundError",
    });
    expect(repositorio.obtenerEscaneoPorId).toHaveBeenCalledWith(1, {
      tipo: "escuela",
      escuelaId: 5,
    });
    expect(repositorio.eliminarEscaneo).not.toHaveBeenCalled();
    expect(auditor).not.toHaveBeenCalled();
  });
});
