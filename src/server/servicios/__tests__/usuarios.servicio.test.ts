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

  it("un destino fuera del ámbito responde NotFoundError sin escribir ni auditar", async () => {
    const auditor = vi.fn();
    const repo = crearRepoFalso({ obtenerUsuarioPorId: vi.fn().mockResolvedValue(undefined) });
    const servicio = crearServicioUsuarios(repo, auditor);

    await expect(
      servicio.cambiarEstado(10, false, sesion({ nivel: 2, regionId: 2 }))
    ).rejects.toMatchObject({ name: "NotFoundError" });
    await expect(
      servicio.actualizarPassword(10, "h", sesion({ nivel: 2, regionId: 2 }))
    ).rejects.toMatchObject({ name: "NotFoundError" });
    expect(repo.obtenerUsuarioPorId).toHaveBeenCalledWith(10, { tipo: "region", regionId: 2 });
    expect(repo.cambiarEstadoUsuario).not.toHaveBeenCalled();
    expect(repo.actualizarPassword).not.toHaveBeenCalled();
    expect(auditor).not.toHaveBeenCalled();
  });

  it("un destino dentro del ámbito con rol más privilegiado responde ForbiddenError", async () => {
    const repo = crearRepoFalso({
      obtenerUsuarioPorId: vi.fn().mockResolvedValue(usuarioObjetivoAdminPais),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);
    await expect(
      servicio.cambiarEstado(10, false, sesion({ nivel: 2, regionId: 2 }))
    ).rejects.toMatchObject({ name: "ForbiddenError" });
  });
});

describe("usuarios.servicio — lecturas con ámbito", () => {
  it("propaga el ámbito al listar y al obtener", async () => {
    const repo = crearRepoFalso({ obtenerUsuarioPorId: vi.fn().mockResolvedValue({ id: 1 }) });
    const servicio = crearServicioUsuarios(repo, auditorNoop);
    const ambito = { tipo: "escuela" as const, escuelaId: 5 };
    await servicio.listar(ambito);
    await servicio.obtenerPorId(1, ambito);
    expect(repo.listarUsuarios).toHaveBeenCalledWith(ambito);
    expect(repo.obtenerUsuarioPorId).toHaveBeenCalledWith(1, ambito);
  });

  it("obtener un usuario fuera del ámbito lanza NotFoundError", async () => {
    const repo = crearRepoFalso({ obtenerUsuarioPorId: vi.fn().mockResolvedValue(undefined) });
    const servicio = crearServicioUsuarios(repo, auditorNoop);
    await expect(
      servicio.obtenerPorId(1, { tipo: "escuela", escuelaId: 5 })
    ).rejects.toMatchObject({ name: "NotFoundError" });
  });
});

describe("usuarios.servicio — Admin País", () => {
  it("gestiona usuarios de cualquier escuela o región", async () => {
    const destino = {
      id: 10, email: "x@e2e.test", activo: true, funcionarioId: 5, rolId: 4, nivel: 4,
      funcionarioNombres: "X", funcionarioApellidos: "Y", funcionarioPuesto: "Z",
    };
    const repo = crearRepoFalso({
      obtenerUsuarioPorId: vi.fn().mockResolvedValue(destino),
      obtenerAmbitoDeFuncionario: vi.fn().mockResolvedValue({ escuelaIds: [77], regionIds: [9] }),
    });
    const servicio = crearServicioUsuarios(repo, auditorNoop);

    await servicio.cambiarEstado(10, false, sesion({ nivel: 1 }));
    await servicio.actualizarPassword(10, "h", sesion({ nivel: 1 }));

    expect(repo.obtenerUsuarioPorId).toHaveBeenCalledWith(10, { tipo: "pais" });
    expect(repo.cambiarEstadoUsuario).toHaveBeenCalledWith(10, false);
    expect(repo.actualizarPassword).toHaveBeenCalledWith(10, "h");
  });
});
