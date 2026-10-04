import { describe, it, expect, vi } from "vitest";
import type { Auditor } from "../auditoria.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";
import { ErrorConflicto, ErrorNoEncontrado } from "@/server/errores";

describe("regionesServicio", () => {
  const auditorMock: Auditor = vi.fn().mockResolvedValue(undefined);

  function crearMockRepos() {
    return {
      listarRegiones: vi.fn(),
      obtenerRegionPorId: vi.fn(),
      crearRegion: vi.fn(),
      actualizarRegion: vi.fn(),
      desactivarRegion: vi.fn(),
      contarEscuelasActivas: vi.fn(),
    };
  }

  const sesionAdminPais: SesionUsuario = {
    usuarioId: 1,
    email: "admin@pais.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };

  describe("listarRegiones", () => {
    it("retorna todas las regiones activas", async () => {
      const repos = crearMockRepos();
      repos.listarRegiones.mockResolvedValue([
        { id: 1, nombre: "San José", activo: true },
      ]);

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);
      const resultado = await servicio.listarRegiones();

      expect(resultado).toHaveLength(1);
    });
  });

  describe("crearRegion", () => {
    it("crea una region exitosamente", async () => {
      const repos = crearMockRepos();
      repos.obtenerRegionPorId.mockResolvedValue(undefined);
      repos.crearRegion.mockResolvedValue({ id: 1, nombre: "San José", activo: true });

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);
      const resultado = await servicio.crearRegion(
        { nombre: "San José" },
        sesionAdminPais
      );

      expect(resultado).toEqual({ id: 1, nombre: "San José", activo: true });
      expect(auditorMock).toHaveBeenCalled();
    });

    it("rechaza nombre vacio", async () => {
      const repos = crearMockRepos();
      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);

      await expect(
        servicio.crearRegion({ nombre: "" }, sesionAdminPais)
      ).rejects.toThrow("El nombre de la región no puede estar vacío");
    });
  });

  describe("actualizarRegion", () => {
    it("actualiza una region exitosamente", async () => {
      const repos = crearMockRepos();
      repos.obtenerRegionPorId.mockResolvedValue({ id: 1, nombre: "San José", activo: true });
      repos.actualizarRegion.mockResolvedValue({ id: 1, nombre: "San José Centro", activo: true });

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);
      const resultado = await servicio.actualizarRegion(
        1,
        { nombre: "San José Centro" },
        sesionAdminPais
      );

      expect(resultado?.nombre).toBe("San José Centro");
      expect(auditorMock).toHaveBeenCalled();
    });

    it("lanza ErrorNoEncontrado si la region no existe", async () => {
      const repos = crearMockRepos();
      repos.obtenerRegionPorId.mockResolvedValue(undefined);

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);

      await expect(
        servicio.actualizarRegion(999, { nombre: "Nueva" }, sesionAdminPais)
      ).rejects.toBeInstanceOf(ErrorNoEncontrado);
    });
  });

  describe("desactivarRegion", () => {
    it("desactiva una region sin escuelas", async () => {
      const repos = crearMockRepos();
      repos.obtenerRegionPorId.mockResolvedValue({ id: 1, nombre: "San José", activo: true });
      repos.contarEscuelasActivas.mockResolvedValue(0);
      repos.desactivarRegion.mockResolvedValue({ id: 1, nombre: "San José", activo: false });

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);
      const resultado = await servicio.desactivarRegion(1, sesionAdminPais);

      expect(resultado?.activo).toBe(false);
      expect(auditorMock).toHaveBeenCalled();
    });

    it("rechaza desactivar region con escuelas activas con ErrorConflicto", async () => {
      const repos = crearMockRepos();
      repos.obtenerRegionPorId.mockResolvedValue({ id: 1, nombre: "San José", activo: true });
      repos.contarEscuelasActivas.mockResolvedValue(3);

      const { crearServicioRegiones } = await import("../regiones.servicio");
      const servicio = crearServicioRegiones(repos, auditorMock);

      await expect(
        servicio.desactivarRegion(1, sesionAdminPais)
      ).rejects.toBeInstanceOf(ErrorConflicto);
    });
  });
});
