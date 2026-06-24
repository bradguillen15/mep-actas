import { describe, it, expect, vi } from "vitest";
import { crearServicioUsuarios } from "../usuarios.servicio";
import type { SesionUsuario } from "@/server/auth/tipos";

function sesion(parcial: Partial<SesionUsuario> & Pick<SesionUsuario, "nivel">): SesionUsuario {
  return {
    usuarioId: 99,
    email: "actor@e2e.test",
    rolId: 1,
    funcionarioId: 99,
    ...parcial,
  };
}

function crearRepoFalso(overrides: Record<string, unknown> = {}) {
  return {
    listarUsuarios: vi.fn().mockResolvedValue([]),
    obtenerUsuarioPorId: vi.fn(),
    obtenerUsuarioPorEmail: vi.fn().mockResolvedValue(undefined),
    crearUsuario: vi.fn().mockResolvedValue({
      id: 10,
      funcionarioId: 5,
      rolId: 3,
      email: "nuevo@e2e.test",
      passwordHash: "h",
      activo: true,
    }),
    actualizarPassword: vi.fn().mockResolvedValue(undefined),
    cambiarEstadoUsuario: vi.fn().mockResolvedValue({
      id: 10,
      funcionarioId: 5,
      rolId: 3,
      email: "nuevo@e2e.test",
      passwordHash: "h",
      activo: false,
    }),
    obtenerNivelDeRol: vi.fn().mockResolvedValue(3),
    obtenerAmbitoDeFuncionario: vi
      .fn()
      .mockResolvedValue({ escuelaIds: [1], regionIds: [2] }),
    ...overrides,
  };
}

const auditorNoop = vi.fn().mockResolvedValue(undefined);

describe("usuarios.servicio — jerarquía en crear", () => {
  it("deniega que un Admin Regional cree un Admin País", async () => {
    const repo = crearRepoFalso({
      obtenerNivelDeRol: vi.fn().mockResolvedValue(1),
      obtenerAmbitoDeFuncionario: vi
        .fn()
        .mockResolvedValue({ escuelaIds: [1], regionIds: [2] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await expect(
      servicio.crear(
        { funcionarioId: 5, rolId: 1, email: "x@e2e.test", passwordHash: "h" },
        sesion({ nivel: 2, regionId: 2 })
      )
    ).rejects.toThrow();
    expect(repo.crearUsuario).not.toHaveBeenCalled();
  });

  it("permite que un Admin Regional cree un Admin Escuela en su región", async () => {
    const repo = crearRepoFalso({
      obtenerNivelDeRol: vi.fn().mockResolvedValue(3),
      obtenerAmbitoDeFuncionario: vi
        .fn()
        .mockResolvedValue({ escuelaIds: [1], regionIds: [2] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await servicio.crear(
      { funcionarioId: 5, rolId: 3, email: "x@e2e.test", passwordHash: "h" },
      sesion({ nivel: 2, regionId: 2 })
    );
    expect(repo.crearUsuario).toHaveBeenCalledTimes(1);
  });

  it("permite que un Admin País cree cualquier nivel", async () => {
    const repo = crearRepoFalso({
      obtenerNivelDeRol: vi.fn().mockResolvedValue(1),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await servicio.crear(
      { funcionarioId: 5, rolId: 1, email: "x@e2e.test", passwordHash: "h" },
      sesion({ nivel: 1 })
    );
    expect(repo.crearUsuario).toHaveBeenCalledTimes(1);
  });
});

describe("usuarios.servicio — ámbito en crear", () => {
  it("deniega que un Admin Escuela cree usuarios de otra escuela", async () => {
    const repo = crearRepoFalso({
      obtenerNivelDeRol: vi.fn().mockResolvedValue(4),
      obtenerAmbitoDeFuncionario: vi
        .fn()
        .mockResolvedValue({ escuelaIds: [10], regionIds: [2] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await expect(
      servicio.crear(
        { funcionarioId: 5, rolId: 4, email: "x@e2e.test", passwordHash: "h" },
        sesion({ nivel: 3, escuelaId: 5 })
      )
    ).rejects.toThrow();
    expect(repo.crearUsuario).not.toHaveBeenCalled();
  });

  it("permite que un Admin Escuela cree usuarios de su escuela", async () => {
    const repo = crearRepoFalso({
      obtenerNivelDeRol: vi.fn().mockResolvedValue(4),
      obtenerAmbitoDeFuncionario: vi
        .fn()
        .mockResolvedValue({ escuelaIds: [5], regionIds: [2] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await servicio.crear(
      { funcionarioId: 5, rolId: 4, email: "x@e2e.test", passwordHash: "h" },
      sesion({ nivel: 3, escuelaId: 5 })
    );
    expect(repo.crearUsuario).toHaveBeenCalledTimes(1);
  });
});

describe("usuarios.servicio — jerarquía/ámbito en actualizarPassword y cambiarEstado", () => {
  const usuarioObjetivoAdminPais = {
    id: 10,
    email: "objetivo@e2e.test",
    activo: true,
    funcionarioId: 5,
    rolId: 1,
    nivel: 1,
    funcionarioNombres: "X",
    funcionarioApellidos: "Y",
    funcionarioPuesto: "Z",
  };

  it("deniega que un Admin Escuela restablezca la contraseña de un Admin País", async () => {
    const repo = crearRepoFalso({
      obtenerUsuarioPorId: vi.fn().mockResolvedValue(usuarioObjetivoAdminPais),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await expect(
      servicio.actualizarPassword(10, "nuevohash", sesion({ nivel: 3, escuelaId: 5 }))
    ).rejects.toThrow();
    expect(repo.actualizarPassword).not.toHaveBeenCalled();
  });

  it("deniega desactivar un usuario fuera del ámbito del actor", async () => {
    const repo = crearRepoFalso({
      obtenerUsuarioPorId: vi.fn().mockResolvedValue({
        ...usuarioObjetivoAdminPais,
        rolId: 4,
        nivel: 4,
      }),
      obtenerAmbitoDeFuncionario: vi
        .fn()
        .mockResolvedValue({ escuelaIds: [10], regionIds: [3] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await expect(
      servicio.cambiarEstado(10, false, sesion({ nivel: 2, regionId: 2 }))
    ).rejects.toThrow();
    expect(repo.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });
});
