import { describe, it, expect, vi } from "vitest";
import type { Auditor } from "../auditoria.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";
import {
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorValidacion,
} from "@/server/errores";

describe("tiposActaServicio", () => {
  const auditorMock: Auditor = vi.fn().mockResolvedValue(undefined);

  function crearMockRepos() {
    return {
      listarTiposActaActivos: vi.fn(),
      crearTipoActa: vi.fn(),
      obtenerTipoActaPorId: vi.fn(),
      desactivarTipoActa: vi.fn(),
      contarActasPorTipo: vi.fn(),
    };
  }

  const sesionAdminPais: SesionUsuario = {
    usuarioId: 1,
    email: "admin@pais.go.cr",
    nivel: 1,
    rolId: 1,
    funcionarioId: 1,
  };

  describe("listarTiposActa", () => {
    it("retorna los tipos activos del repositorio", async () => {
      const repos = crearMockRepos();
      repos.listarTiposActaActivos.mockResolvedValue([
        { id: 1, nombre: "Graduación" },
      ]);

      const { crearServicioTiposActa } = await import("../tipos-acta.servicio");
      const servicio = crearServicioTiposActa(repos, auditorMock);

      await expect(servicio.listarTiposActa()).resolves.toEqual([
        { id: 1, nombre: "Graduación" },
      ]);
    });
  });

  describe("crearTipoActa", () => {
    it("crea y audita un tipo con nombre válido", async () => {
      const repos = crearMockRepos();
      repos.crearTipoActa.mockResolvedValue({
        id: 2,
        nombre: "Promoción",
        activo: true,
      });

      const { crearServicioTiposActa } = await import("../tipos-acta.servicio");
      const servicio = crearServicioTiposActa(repos, auditorMock);
      const tipo = await servicio.crearTipoActa(
        { nombre: "  Promoción  " },
        sesionAdminPais
      );

      expect(repos.crearTipoActa).toHaveBeenCalledWith({ nombre: "Promoción" });
      expect(tipo.nombre).toBe("Promoción");
      expect(auditorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tabla: "tipos_acta",
          accion: "crear",
          registroId: 2,
        })
      );
    });

    it("rechaza nombre vacío con ErrorValidacion", async () => {
      const repos = crearMockRepos();
      const { crearServicioTiposActa } = await import("../tipos-acta.servicio");
      const servicio = crearServicioTiposActa(repos, auditorMock);

      await expect(
        servicio.crearTipoActa({ nombre: "   " }, sesionAdminPais)
      ).rejects.toBeInstanceOf(ErrorValidacion);
      expect(repos.crearTipoActa).not.toHaveBeenCalled();
    });
  });

  describe("desactivarTipoActa", () => {
    it("lanza ErrorNoEncontrado si el tipo no existe", async () => {
      const repos = crearMockRepos();
      repos.obtenerTipoActaPorId.mockResolvedValue(undefined);

      const { crearServicioTiposActa } = await import("../tipos-acta.servicio");
      const servicio = crearServicioTiposActa(repos, auditorMock);

      await expect(
        servicio.desactivarTipoActa(999, sesionAdminPais)
      ).rejects.toBeInstanceOf(ErrorNoEncontrado);
    });

    it("lanza ErrorConflicto si hay actas asociadas", async () => {
      const repos = crearMockRepos();
      repos.obtenerTipoActaPorId.mockResolvedValue({
        id: 1,
        nombre: "Graduación",
        activo: true,
      });
      repos.contarActasPorTipo.mockResolvedValue(2);

      const { crearServicioTiposActa } = await import("../tipos-acta.servicio");
      const servicio = crearServicioTiposActa(repos, auditorMock);

      await expect(
        servicio.desactivarTipoActa(1, sesionAdminPais)
      ).rejects.toBeInstanceOf(ErrorConflicto);
    });
  });
});
