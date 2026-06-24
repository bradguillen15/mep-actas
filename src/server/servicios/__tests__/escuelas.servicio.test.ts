import { describe, it, expect, vi } from "vitest";
import type { Auditor } from "../auditoria.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";

describe("escuelasServicio", () => {
  const auditorMock: Auditor = vi.fn().mockResolvedValue(undefined);

  function crearMockRepos() {
    return {
      listarEscuelas: vi.fn(),
      obtenerEscuelaPorId: vi.fn(),
      crearEscuela: vi.fn(),
      actualizarEscuela: vi.fn(),
      desactivarEscuela: vi.fn(),
      contarActasActivas: vi.fn(),
    };
  }

  const sesionAdminPais: SesionUsuario = {
    usuarioId: 1,
    email: "admin@pais.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };

  const sesionAdminRegional: SesionUsuario = {
    usuarioId: 2,
    email: "admin@region.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 2,
    regionId: 5,
  };

  const sesionAdminRegionalOtraRegion: SesionUsuario = {
    usuarioId: 3,
    email: "admin@otra.go.cr",
    nivel: 2,
    rolId: 2,
    funcionarioId: 3,
    regionId: 10,
  };

  describe("listarEscuelas", () => {
    it("retorna todas las escuelas activas", async () => {
      const repos = crearMockRepos();
      repos.listarEscuelas.mockResolvedValue([
        { id: 1, regionId: 1, codigoMep: "MEP-001", nombre: "Escuela Central", activo: true },
      ]);

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      const resultado = await servicio.listarEscuelas();

      expect(resultado).toHaveLength(1);
    });

    it("filtra por regionId", async () => {
      const repos = crearMockRepos();
      repos.listarEscuelas.mockResolvedValue([]);

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      await servicio.listarEscuelas({ regionId: 1 });

      expect(repos.listarEscuelas).toHaveBeenCalledWith({ regionId: 1 });
    });
  });

  describe("crearEscuela", () => {
    it("Admin Pais crea escuela en cualquier region", async () => {
      const repos = crearMockRepos();
      repos.crearEscuela.mockResolvedValue({
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: true,
      });

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      const resultado = await servicio.crearEscuela(
        { regionId: 1, codigoMep: "MEP-001", nombre: "Escuela Central" },
        sesionAdminPais
      );

      expect(resultado.nombre).toBe("Escuela Central");
      expect(auditorMock).toHaveBeenCalled();
    });

    it("Admin Regional crea escuela en su region", async () => {
      const repos = crearMockRepos();
      repos.crearEscuela.mockResolvedValue({
        id: 2,
        regionId: 5,
        codigoMep: "MEP-002",
        nombre: "Escuela Regional",
        activo: true,
      });

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      const resultado = await servicio.crearEscuela(
        { regionId: 5, codigoMep: "MEP-002", nombre: "Escuela Regional" },
        sesionAdminRegional
      );

      expect(resultado.regionId).toBe(5);
    });

    it("Admin Regional no puede crear en otra region", async () => {
      const repos = crearMockRepos();

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.crearEscuela(
          { regionId: 5, codigoMep: "MEP-003", nombre: "Escuela" },
          sesionAdminRegionalOtraRegion
        )
      ).rejects.toThrow("No tiene permisos para crear escuelas en esta región");
    });

    it("rechaza codigoMep vacio", async () => {
      const repos = crearMockRepos();

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.crearEscuela(
          { regionId: 1, codigoMep: "", nombre: "Escuela" },
          sesionAdminPais
        )
      ).rejects.toThrow("El código MEP no puede estar vacío");
    });

    it("rechaza nombre vacio", async () => {
      const repos = crearMockRepos();

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.crearEscuela(
          { regionId: 1, codigoMep: "MEP-001", nombre: "" },
          sesionAdminPais
        )
      ).rejects.toThrow("El nombre de la escuela no puede estar vacío");
    });
  });

  describe("actualizarEscuela", () => {
    it("Admin Regional actualiza escuela de su region", async () => {
      const repos = crearMockRepos();
      repos.obtenerEscuelaPorId.mockResolvedValue({
        id: 2,
        regionId: 5,
        codigoMep: "MEP-002",
        nombre: "Escuela Regional",
        activo: true,
      });
      repos.actualizarEscuela.mockResolvedValue({
        id: 2,
        regionId: 5,
        codigoMep: "MEP-002",
        nombre: "Escuela Actualizada",
        activo: true,
      });

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      const resultado = await servicio.actualizarEscuela(
        2,
        { nombre: "Escuela Actualizada" },
        sesionAdminRegional
      );

      expect(resultado?.nombre).toBe("Escuela Actualizada");
    });

    it("Admin Regional no puede actualizar escuela fuera de su region", async () => {
      const repos = crearMockRepos();
      repos.obtenerEscuelaPorId.mockResolvedValue({
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: true,
      });

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.actualizarEscuela(
          1,
          { nombre: "Nuevo" },
          sesionAdminRegionalOtraRegion
        )
      ).rejects.toThrow("No tiene permisos para modificar esta escuela");
    });

    it("lanza 404 si la escuela no existe", async () => {
      const repos = crearMockRepos();
      repos.obtenerEscuelaPorId.mockResolvedValue(undefined);

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.actualizarEscuela(999, { nombre: "Nuevo" }, sesionAdminPais)
      ).rejects.toThrow("Escuela no encontrada");
    });
  });

  describe("desactivarEscuela", () => {
    it("Administrador País desactiva escuela sin actas", async () => {
      const repos = crearMockRepos();
      repos.obtenerEscuelaPorId.mockResolvedValue({
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: true,
      });
      repos.contarActasActivas.mockResolvedValue(0);
      repos.desactivarEscuela.mockResolvedValue({
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: false,
      });

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);
      const resultado = await servicio.desactivarEscuela(1, sesionAdminPais);

      expect(resultado?.activo).toBe(false);
      expect(auditorMock).toHaveBeenCalled();
    });

    it("rechaza desactivar escuela con actas activas", async () => {
      const repos = crearMockRepos();
      repos.obtenerEscuelaPorId.mockResolvedValue({
        id: 1,
        regionId: 1,
        codigoMep: "MEP-001",
        nombre: "Escuela Central",
        activo: true,
      });
      repos.contarActasActivas.mockResolvedValue(5);

      const { crearServicioEscuelas } = await import("../escuelas.servicio");
      const servicio = crearServicioEscuelas(repos, auditorMock);

      await expect(
        servicio.desactivarEscuela(1, sesionAdminPais)
      ).rejects.toThrow(
        "No se puede desactivar una escuela con actas activas"
      );
    });
  });
});
