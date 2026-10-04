import { describe, it, expect, vi } from "vitest";

describe("regionesRepositorio", () => {
  function crearMockDb() {
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();
    const mockAll = vi.fn();
    const mockInsert = vi.fn();
    const mockValues = vi.fn();
    const mockReturning = vi.fn();
    const mockUpdate = vi.fn();
    const mockSet = vi.fn();

    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere, all: mockAll });
    mockWhere.mockReturnValue({ all: mockAll, returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([]);
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });

    return {
      db: {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      } as never,
      mocks: {
        mockSelect,
        mockFrom,
        mockWhere,
        mockAll,
        mockInsert,
        mockValues,
        mockReturning,
        mockUpdate,
        mockSet,
      },
    };
  }

  describe("listarRegiones", () => {
    it("retorna todas las regiones activas", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([
        { id: 1, nombre: "San José", activo: 1 },
        { id: 2, nombre: "Alajuela", activo: 1 },
      ]);

      const { listarRegiones } = await import("../regiones.repositorio");
      const resultado = await listarRegiones(db);

      expect(resultado).toHaveLength(2);
      expect(mocks.mockSelect).toHaveBeenCalled();
    });

    it("retorna lista vacia si no hay regiones", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([]);

      const { listarRegiones } = await import("../regiones.repositorio");
      const resultado = await listarRegiones(db);

      expect(resultado).toEqual([]);
    });
  });

  describe("obtenerRegionPorId", () => {
    it("retorna una region por su id", async () => {
      const { db, mocks } = crearMockDb();
      const regionEsperada = { id: 1, nombre: "San José", activo: 1 };
      mocks.mockAll.mockResolvedValue([regionEsperada]);

      const { obtenerRegionPorId } = await import("../regiones.repositorio");
      const resultado = await obtenerRegionPorId(db, 1);

      expect(resultado).toEqual(regionEsperada);
    });

    it("retorna undefined si no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([]);

      const { obtenerRegionPorId } = await import("../regiones.repositorio");
      const resultado = await obtenerRegionPorId(db, 999);

      expect(resultado).toBeUndefined();
    });
  });

  describe("crearRegion", () => {
    it("inserta una region y retorna los datos", async () => {
      const { db, mocks } = crearMockDb();
      const regionCreada = { id: 1, nombre: "San José", activo: 1 };
      mocks.mockReturning.mockResolvedValue([regionCreada]);

      const { crearRegion } = await import("../regiones.repositorio");
      const resultado = await crearRegion(db, { nombre: "San José" });

      expect(resultado).toEqual(regionCreada);
      expect(mocks.mockInsert).toHaveBeenCalled();
      expect(mocks.mockValues).toHaveBeenCalledWith({ nombre: "San José" });
    });
  });

  describe("actualizarRegion", () => {
    it("actualiza el nombre de una region", async () => {
      const { db, mocks } = crearMockDb();
      const regionActualizada = { id: 1, nombre: "San José Centro", activo: 1 };
      mocks.mockReturning.mockResolvedValue([regionActualizada]);

      const { actualizarRegion } = await import("../regiones.repositorio");
      const resultado = await actualizarRegion(db, 1, {
        nombre: "San José Centro",
      });

      expect(resultado).toEqual(regionActualizada);
    });

    it("retorna undefined si la region no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockReturning.mockResolvedValue([]);

      const { actualizarRegion } = await import("../regiones.repositorio");
      const resultado = await actualizarRegion(db, 999, { nombre: "Nueva" });

      expect(resultado).toBeUndefined();
    });
  });

  describe("desactivarRegion", () => {
    it("establece activo en false", async () => {
      const { db, mocks } = crearMockDb();
      const regionDesactivada = { id: 1, nombre: "San José", activo: 0 };
      mocks.mockReturning.mockResolvedValue([regionDesactivada]);

      const { desactivarRegion } = await import("../regiones.repositorio");
      const resultado = await desactivarRegion(db, 1);

      expect(resultado).toEqual(regionDesactivada);
    });
  });

  describe("contarEscuelasActivas", () => {
    it("retorna el conteo de escuelas activas en una region", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([{ conteo: 5 }]);

      const { contarEscuelasActivas } = await import("../regiones.repositorio");
      const resultado = await contarEscuelasActivas(db, 1);

      expect(resultado).toBe(5);
    });
  });
});
