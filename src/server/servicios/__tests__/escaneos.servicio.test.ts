import { describe, it, expect, vi } from "vitest";

import { crearServicioEscaneos } from "../escaneos.servicio";
import type { AlmacenamientoEscaneos } from "@/server/almacenamiento/puerto";

const mockGenerarUrlLectura = vi.fn();
const mockGenerarUrlSubida = vi.fn();

const almacenamiento: AlmacenamientoEscaneos = {
  generarUrlLectura: mockGenerarUrlLectura,
  generarUrlSubida: mockGenerarUrlSubida,
};

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
      obtenerEscaneoPorEscuelaTomoFolio: vi.fn(),
      crearEscaneo: vi.fn(),
      eliminarEscaneo: vi.fn(),
    };

    const servicio = crearServicioEscaneos(repositorio, vi.fn(), almacenamiento);
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
      obtenerEscaneoPorEscuelaTomoFolio: vi.fn(),
      crearEscaneo: vi.fn(),
      eliminarEscaneo: vi.fn(),
    };
    const auditor = vi.fn();
    return { repositorio, auditor, servicio: crearServicioEscaneos(repositorio, auditor, almacenamiento) };
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

describe("prepararSubida", () => {
  const sesion = {
    usuarioId: 4, email: "s@mep.go.cr", rolId: 4, nivel: 4 as const, funcionarioId: 4, escuelaId: 5,
  };

  function crearServicio() {
    const repositorio = {
      listarEscaneos: vi.fn(),
      obtenerEscaneoPorId: vi.fn(),
      obtenerEscaneoPorEscuelaTomoFolio: vi.fn().mockResolvedValue(undefined),
      crearEscaneo: vi.fn().mockResolvedValue({ id: 9, escuelaId: 5 }),
      eliminarEscaneo: vi.fn(),
    };
    mockGenerarUrlSubida.mockReset().mockResolvedValue("/api/almacenamiento-local/x");
    return {
      servicio: crearServicioEscaneos(repositorio, vi.fn(), almacenamiento),
      repositorio,
    };
  }

  it.each([
    ["pdf", "application/pdf"],
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
  ])("pide la URL de subida con el tipo de contenido de %s", async (formato, tipo) => {
    const { servicio } = crearServicio();
    const resultado = await servicio.prepararSubida(
      { escuelaId: 5, numeroTomo: 2, numeroFolio: 3, formato },
      sesion
    );
    expect(resultado.clave).toBe(`escaneos/5/2/3.${formato}`);
    expect(mockGenerarUrlSubida).toHaveBeenCalledWith(resultado.clave, tipo);
  });

  it("rechaza formatos no permitidos", async () => {
    const { servicio } = crearServicio();
    await expect(
      servicio.prepararSubida({ escuelaId: 5, numeroTomo: 2, numeroFolio: 3, formato: "exe" }, sesion)
    ).rejects.toThrow(/no permitido/i);
  });

  it("reutiliza el escaneo existente sin insertar otra fila", async () => {
    const { servicio, repositorio } = crearServicio();
    const existente = {
      id: 3,
      escuelaId: 5,
      numeroTomo: 2,
      numeroFolio: 3,
      url: "escaneos/5/2/3.jpg",
      formato: "jpg",
      uploadedBy: 1,
      createdAt: "2026-01-01",
    };
    repositorio.obtenerEscaneoPorEscuelaTomoFolio.mockResolvedValue(existente);

    const resultado = await servicio.prepararSubida(
      { escuelaId: 5, numeroTomo: 2, numeroFolio: 3, formato: "jpg" },
      sesion
    );

    expect(resultado.escaneo).toEqual(existente);
    expect(repositorio.crearEscaneo).not.toHaveBeenCalled();
  });
});
