import { describe, it, expect, vi } from "vitest";

describe("escuelasRepositorio", () => {
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

  describe("listarEscuelas", () => {
    it("retorna todas las escuelas activas", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([
        {
          id: 1,
          regionId: 1,
          codigoMep: "MEP-001",
          nombre: "Escuela Central",
          activo: 1,
        },
      ]);

      const { listarEscuelas } = await import("../escuelas.repositorio");
      const resultado = await listarEscuelas(db);

      expect(resultado).toHaveLength(1);
    });

    it("filtra por regionId", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([]);

      const { listarEscuelas } = await import("../escuelas.repositorio");
      await listarEscuelas(db, { regionId: 1 });

      expect(mocks.mockWhere).toHaveBeenCalled();
    });
  });

  describe("obtenerEscuelaPorId", () => {
    it("retorna una escuela por su id", async () => {
      const { db, mocks } = crearMockDb();
      const escuela = {
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: 1,
      };
      mocks.mockAll.mockResolvedValue([escuela]);

      const { obtenerEscuelaPorId } = await import("../escuelas.repositorio");
      const resultado = await obtenerEscuelaPorId(db, 1);

      expect(resultado).toEqual(escuela);
    });

    it("retorna undefined si no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([]);

      const { obtenerEscuelaPorId } = await import("../escuelas.repositorio");
      const resultado = await obtenerEscuelaPorId(db, 999);

      expect(resultado).toBeUndefined();
    });
  });

  describe("crearEscuela", () => {
    it("inserta una escuela y retorna los datos", async () => {
      const { db, mocks } = crearMockDb();
      const escuela = {
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: 1,
      };
      mocks.mockReturning.mockResolvedValue([escuela]);

      const { crearEscuela } = await import("../escuelas.repositorio");
      const resultado = await crearEscuela(db, {
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
      });

      expect(resultado).toEqual(escuela);
    });
  });

  describe("actualizarEscuela", () => {
    it("actualiza datos de una escuela", async () => {
      const { db, mocks } = crearMockDb();
      const escuela = {
        id: 1,
        regionId: 1,
        codigoMep: "MEP-002",
        nombre: "Escuela Actualizada",
        activo: 1,
      };
      mocks.mockReturning.mockResolvedValue([escuela]);

      const { actualizarEscuela } = await import("../escuelas.repositorio");
      const resultado = await actualizarEscuela(db, 1, {
        nombre: "Escuela Actualizada",
      });

      expect(resultado).toEqual(escuela);
    });

    it("retorna undefined si no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockReturning.mockResolvedValue([]);

      const { actualizarEscuela } = await import("../escuelas.repositorio");
      const resultado = await actualizarEscuela(db, 999, {
        nombre: "Escuela",
      });

      expect(resultado).toBeUndefined();
    });
  });

  describe("desactivarEscuela", () => {
    it("desactiva una escuela", async () => {
      const { db, mocks } = crearMockDb();
      const escuela = {
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: 0,
      };
      mocks.mockReturning.mockResolvedValue([escuela]);

      const { desactivarEscuela } = await import("../escuelas.repositorio");
      const resultado = await desactivarEscuela(db, 1);

      expect(resultado).toEqual(escuela);
    });

    it("retorna undefined si no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockReturning.mockResolvedValue([]);

      const { desactivarEscuela } = await import("../escuelas.repositorio");
      const resultado = await desactivarEscuela(db, 999);

      expect(resultado).toBeUndefined();
    });
  });

  describe("contarActasActivas", () => {
    it("retorna el conteo de actas activas de una escuela", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([{ conteo: 3 }]);

      const { contarActasActivas } = await import("../escuelas.repositorio");
      const resultado = await contarActasActivas(db, 1);

      expect(resultado).toBe(3);
    });
  });

  describe("resolverAmbitoDeEscuela", () => {
    it("devuelve la escuela con su región", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([
        { id: 7, regionId: 2, codigoMep: "MEP-007", nombre: "Escuela", activo: 1 },
      ]);

      const { resolverAmbitoDeEscuela } = await import("../escuelas.repositorio");
      const resultado = await resolverAmbitoDeEscuela(db, 7);

      expect(resultado).toEqual({ escuelaId: 7, regionId: 2 });
    });

    it("devuelve undefined si la escuela no existe", async () => {
      const { db, mocks } = crearMockDb();
      mocks.mockAll.mockResolvedValue([]);

      const { resolverAmbitoDeEscuela } = await import("../escuelas.repositorio");
      const resultado = await resolverAmbitoDeEscuela(db, 999);

      expect(resultado).toBeUndefined();
    });
  });
});
